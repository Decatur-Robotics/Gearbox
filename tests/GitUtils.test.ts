import { getGitBranchName } from "@/lib/GitUtils";
import git from "isomorphic-git";
import fs from "fs";

test(`${getGitBranchName.name}: Returns Correct Branch Name`, async () => {
  const branch = await git.currentBranch({ fs, dir: "./" });
  expect(getGitBranchName()).toEqual(branch);
});