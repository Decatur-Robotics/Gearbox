/**
 * DO NOT IMPORT THIS FILE IN THE WEBSITE ITSELF
 */
import { createInterface } from "readline";

/**
 * Intended for use in scripts
 *
 * @param prompt What to ask the user
 * @returns The user's input
 */
export function getCommandLineInput(prompt: string) {
	return new Promise<string>((resolve) => {
		const readline = createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		readline.question(prompt + " ", (answer: string) => {
			readline.close();
			resolve(answer);
		});
	});
}
