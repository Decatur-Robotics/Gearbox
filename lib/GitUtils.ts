import { readFileSync } from "fs";

export function getGitBranchName() {
  const headFile = readFileSync(".git/HEAD");
  const headFileString = headFile.toString();
  return headFileString.split("/").pop();
}