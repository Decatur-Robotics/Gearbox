import { loadEnvConfig } from "@next/env";

export default function setup() {
	const projectDir = process.cwd();
	loadEnvConfig(projectDir);
}
