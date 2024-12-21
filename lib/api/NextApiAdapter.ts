import { NextApiRequest, NextApiResponse } from "next";
import ApiLib from "./ApiLib";
import { OmitCallSignature } from "../Types";

namespace NextApiAdapter {
	export class NextResponse<TSend> implements ApiLib.ApiResponse<TSend> {
		constructor(public innerRes: NextApiResponse) {}

		send(data: TSend | ApiLib.Errors.ErrorType) {
			this.innerRes.send(data);
			return this;
		}

		status(code: number) {
			this.innerRes.status(code);
			return this;
		}

		error(code: number, message: string) {
			this.innerRes.status(code).send({ error: message });
			return this;
		}
	}

	export function createRoute<
		TArgs extends Array<any>,
		TReturn,
		TDependencies,
		TFetchedDuringAuth,
	>(
		server: Omit<
			OmitCallSignature<
				ApiLib.Route<
					TArgs,
					TReturn,
					TDependencies,
					TFetchedDuringAuth,
					NextApiRequest
				>
			>,
			"subUrl"
		>,
		clientHandler?: (...args: any) => Promise<any>,
	): ApiLib.Route<
		TArgs,
		TReturn,
		TDependencies,
		TFetchedDuringAuth,
		NextApiRequest
	> {
		return ApiLib.createRoute(server, clientHandler);
	}

	export abstract class ServerApi<TDependencies> extends ApiLib.ServerApi<
		TDependencies,
		NextApiRequest,
		NextResponse<unknown>
	> {
		protected parseRawResponse(rawRes: any): NextResponse<unknown> {
			return new NextResponse(rawRes);
		}
	}
}
