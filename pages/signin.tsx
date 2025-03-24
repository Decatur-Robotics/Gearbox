import Container from "@/components/Container";
import SignInMenu from "@/components/SignInMenu";

export default function SignIn() {
	return (
		<Container
			requireAuthentication={false}
			title="Sign In"
		>
			<SignInMenu />
		</Container>
	);
}
