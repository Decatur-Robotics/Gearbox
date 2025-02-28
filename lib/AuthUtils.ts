export function allowEmailSignIn(email: string) {
	if (email.endsWith(".ru")) return false;

	return true;
}
