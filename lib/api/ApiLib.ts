import OmitCallSignature from "omit-call-signature";
import { NextApiResponse } from "next";
import toast from "react-hot-toast";

/**
 * @tested_by tests/lib/api/ApiLib.test.ts
 */
namespace ApiLib {
	export namespace Errors {
		export type ErrorType = { error: string };

		export class Error {
			errorCode: number;
			description: string;
			route: string | undefined;

			constructor(
				res: ApiResponse<ErrorType>,
				errorCode: number = 500,
				description: string = "The server encountered an error while processing the request",
			) {
				this.errorCode = errorCode;
				this.description = description;

				res.error(errorCode, description);
			}

			toString() {
				return `${this.errorCode}: ${this.description}`;
			}
		}

		export class NotFoundError extends Error {
			constructor(res: ApiResponse<ErrorType>, routeName: string) {
				super(res, 404, `This API Route (/${routeName}) does not exist`);
			}
		}

		export class InvalidRequestError extends Error {
			constructor(res: ApiResponse<ErrorType>) {
				super(res, 400, "Invalid Request");
			}
		}

		export class UnauthorizedError extends Error {
			constructor(res: ApiResponse<ErrorType>) {
				super(res, 403, "You are not authorized to execute this route");
			}
		}

		export class InternalServerError extends Error {
			constructor(res: ApiResponse<ErrorType>) {
				super(
					res,
					500,
					"The server encountered an error while processing the request",
				);
			}
		}
	}

	export interface HttpRequest {
		url?: string;
		body: any;
	}

	export interface ApiResponse<TSend> {
		send(data: TSend | Errors.ErrorType): ApiResponse<TSend>;
		status(code: number): ApiResponse<TSend>;
		error(code: number, message: string): ApiResponse<TSend>;
	}

	export type Route<
		TArgs extends Array<any>,
		TReturn,
		TDependencies,
		TDataFetchedDuringAuth,
		TRequest extends HttpRequest = HttpRequest,
		TResponse extends ApiResponse<TReturn> = ApiResponse<TReturn>,
	> = {
		subUrl: string;

		(...args: TArgs): Promise<TReturn>;

		isAuthorized: (
			req: TRequest,
			res: TResponse,
			deps: TDependencies,
			args: TArgs,
		) => Promise<{
			authorized: boolean;
			authData: TDataFetchedDuringAuth | undefined;
		}>;
		handler: (
			req: TRequest,
			res: TResponse,
			deps: TDependencies,
			authData: TDataFetchedDuringAuth,
			args: TArgs,
		) => Promise<any> | any;
	};

	export enum RequestMethod {
		POST = "POST",
		GET = "GET",
	}

	export async function request(
		subUrl: string,
		body: any,
		method: RequestMethod = RequestMethod.POST,
	) {
		const rawResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + subUrl, {
			method: method,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		// Null or undefined are sent as an empty string that we can't parse as JSON
		const text = await rawResponse.text();
		const res = text.length ? JSON.parse(text) : undefined;

		if (res?.error) {
			if (res.error === "Unauthorized") {
				toast.error(
					`Unauthorized API request: ${subUrl}. If this is an error, please contact the developers.`,
				);
			}
			throw new Error(`${subUrl}: ${res.error}`);
		}

		return res;
	}

	/**
	 * There's no easy one-liner to create a function with properties while maintaining typing, so I made this shortcut
	 */
	export function createRoute<
		TArgs extends Array<any>,
		TReturn,
		TDependencies,
		TFetchedDuringAuth,
		TRequest extends HttpRequest = HttpRequest,
	>(
		server: Omit<
			OmitCallSignature<
				Route<TArgs, TReturn, TDependencies, TFetchedDuringAuth, TRequest>
			>,
			"subUrl"
		>,
		clientHandler?: (...args: any) => Promise<any>,
	): Route<TArgs, TReturn, TDependencies, TFetchedDuringAuth, TRequest> {
		return Object.assign(
			clientHandler ?? { subUrl: "newRoute" },
			server,
		) as any;
	}

	export type Segment<TDependencies> = {
		[route: string]:
			| Segment<TDependencies>
			| Route<any, any, TDependencies, any>;
	};

	export abstract class ApiTemplate<
		TDependencies,
		TRequest extends HttpRequest = HttpRequest,
	> {
		private initSegment(segment: Segment<any>, subUrl: string) {
			for (const [key, value] of Object.entries(segment)) {
				if (typeof value === "function") {
					value.subUrl = subUrl + "/" + key;
				} else if (
					(value as unknown as Route<any, any, TDependencies, any, TRequest>)
						.subUrl === "newRoute"
				) {
					const route = value as unknown as Route<any, any, TDependencies, any>;
					route.subUrl = subUrl + "/" + key;

					segment[key] = createRoute(route, (...args: any[]) =>
						request(route.subUrl, args),
					);
				} else if (typeof value === "object") {
					this.initSegment(value, subUrl + "/" + key);
				}
			}
		}

		protected init() {
			this.initSegment(this as unknown as Segment<any>, "");
		}

		/**
		 * You need to pass false in subclasses and then call this.init()
		 * @param init Whether to call init() on construction. Pass false if calling super()
		 */
		constructor(init = true) {
			if (init) {
				this.init();
			}
		}
	}

	export enum ErrorLogMode {
		Throw,
		Log,
		None,
	}

	export abstract class ServerApi<
		TDependencies,
		TRequest extends HttpRequest = HttpRequest,
		TResponse extends ApiResponse<any> = ApiResponse<any>,
	> {
		constructor(
			private api: ApiTemplate<TDependencies>,
			private urlPrefix: string,
			private errorLogMode: ErrorLogMode = ErrorLogMode.Log,
		) {}

		async handle(req: TRequest, rawRes: any) {
			const res = this.parseRawResponse(rawRes);

			if (!req.url) {
				throw new Errors.InvalidRequestError(res);
			}

			const path = req.url.slice(this.urlPrefix.length).split("/");

			try {
				const route = path.reduce(
					(segment, route) => Object(segment)[route],
					this.api,
				) as unknown as Route<any, any, TDependencies, any> | undefined;

				if (!route?.handler)
					throw new Errors.NotFoundError(res, path.join("/"));

				const deps = this.getDependencies(req, res);
				const body = req.body;

				const { authorized, authData } = await route.isAuthorized(
					req,
					res,
					deps,
					body,
				);

				if (!authorized) throw new Errors.UnauthorizedError(res);

				await route.handler(req, res, deps, authData, body);
			} catch (e) {
				(e as Errors.Error).route = path.join("/");

				if (this.errorLogMode === ErrorLogMode.None) return;

				if (this.errorLogMode === ErrorLogMode.Throw) throw e;

				console.error(e);

				// If it's an error we've already handled, don't do anything
				if (e instanceof Errors.Error) {
					return;
				}

				new Errors.InternalServerError(res);
			}
		}

		protected parseRawResponse(rawRes: any): TResponse {
			return rawRes;
		}

		abstract getDependencies(req: TRequest, res: TResponse): TDependencies;
	}
}

export default ApiLib;

/**
 * Misc design notes (may be outdated):
 * ApiRoute has 2 call signatures:
 * - (args): client method
 *    - Needs to be populated with full path
 * - (req, res, deps, args): server method
 *
 * ApiSegment has a fields that are ApiRoutes
 *
 * ServerApiManager has a root ApiSegment
 */
