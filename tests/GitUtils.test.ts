import { getGitBranchName } from "@/lib/GitUtils";
import * as git from "nodegit"

test(`${getGitBranchName.name}: Returns Correct Branch Name`, async () => {
  const repo = await git.Repository.open(".");
  const branch = await repo.getCurrentBranch();
  expect(getGitBranchName()).toBe(branch.shorthand());
});