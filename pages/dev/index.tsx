import Container from "@/components/Container";
import { AuthenticationOptions } from "@/lib/Auth";
import { User } from "@/lib/Types";
import { serializeDatabaseObject } from "@/lib/UrlResolver";
import { isDeveloper } from "@/lib/Utils";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { makeObjSerializeable } from "../../lib/client/ClientUtils";

export default function DevIndex({ user }: { user: User }) {
	return (
		<Container
			requireAuthentication={true}
			title="Developer Dashboard"
		>
			<h1 className="text-xl">Developer Dashboard</h1>
			<p>Hello, {user.name}.</p>
			<h2 className="text-lg">Dev Pages</h2>
			<ul className="ml-2 list-disc list-inside">
				<li>
					<Link
						href="/dev/cache"
						className="link link-primary"
					>
						Cache Stats and Lookup
					</Link>
				</li>
				<li>
					<Link
						href="/dev/leveling"
						className="link link-primary"
					>
						Leveling Visualizer
					</Link>
				</li>
				<li>
					<Link
						href="/dev/localstoragedb"
						className="link link-primary"
					>
						LocalStorageDb Tester
					</Link>
				</li>
				<li>
					<Link
						href="/dev/qrpamphlet"
						className="link link-primary"
					>
						QR Pamphlet Viewer
					</Link>
				</li>
				<li>
					<Link
						href="/dev/speedtest"
						className="link link-primary"
					>
						Speedtest
					</Link>
				</li>
				<li>
					<Link
						href="/dev/useranalytics"
						className="link link-primary"
					>
						User Analytics
					</Link>
				</li>
			</ul>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerSession(
		context.req,
		context.res,
		AuthenticationOptions,
	);

	if (!session?.user || !isDeveloper(session.user.email!)) {
		return {
			redirect: {
				destination: "/api/auth/login",
				permanent: false,
			},
		};
	}

	return {
		props: {
			user: makeObjSerializeable(serializeDatabaseObject(session.user)),
		},
	};
};
