import { NextApiRequest, NextApiResponse } from "next";
import OmitCallSignature from "omit-call-signature";
import * as UnifiedApi from "unified-api";

namespace NextApiAdapter {
	export abstract class ApiTemplate<TDependencies> extends UnifiedApi.ApiTemplate<
		TDependencies,
		NextApiRequest
	> {}

	export class NextResponse<TSend> implements UnifiedApi.ApiResponse<TSend> {
		constructor(public innerRes: NextApiResponse) {}

		send(data: TSend | UnifiedApi.ApiErrors.ErrorType) {
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
				UnifiedApi.Route<
					TArgs,
					TReturn,
					TDependencies,
					TFetchedDuringAuth,
					NextApiRequest,
					NextResponse<TReturn>
				>
			>,
			"subUrl"
		>,
		clientHandler?: (...args: any) => Promise<any>,
	): UnifiedApi.Route<
		TArgs,
		TReturn,
		TDependencies,
		TFetchedDuringAuth,
		NextApiRequest,
		NextResponse<TReturn>
	> {
		return UnifiedApi.createRoute(server, clientHandler);
	}

	export abstract class ServerApi<TDependencies> extends UnifiedApi.ServerApi<
		TDependencies,
		NextApiRequest,
		NextResponse<unknown>
	> {
		protected parseRawResponse(rawRes: any): NextResponse<unknown> {
			return new NextResponse(rawRes);
		}
	}
}

export default NextApiAdapter;
