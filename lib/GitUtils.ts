import { readFileSync } from "fs";

/**
 * We have nodegit installed, but it's *really* slow, so we only use it to verify that our custom implementation is correct.
 * Ex: The nodegit equivalent of this function takes ~800ms, while this function takes ~1ms.
 * -Renato, 2024
 * 
 * @tested_by GitUtils.test.ts
 */
export function getGitBranchName() {
  const headFile = readFileSync(".git/HEAD");
  const headFileString = headFile.toString();
  return headFileString.split("/").pop()?.trim();
}

export function getDbName() {
  return process.env.DB_NAME_OVERRIDE ?? process.env.NEXT_PUBLIC_GIT_BRANCH ?? getGitBranchName();
}