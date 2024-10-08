import { getGitBranchName } from "@/lib/GitUtils";
import { Repository } from "nodegit"

test(`${getGitBranchName.name}: Returns Correct Branch Name`, async () => {
  const repo = await Repository.open("./");
  const branch = await repo.getCurrentBranch();
  expect(getGitBranchName()).toEqual(branch.shorthand());
});