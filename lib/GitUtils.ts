import { readFileSync } from "fs";

/**
 * We have isomorphic-git installed, but it's slow, so we only use it to verify that our custom implementation is correct.
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