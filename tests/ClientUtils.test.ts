import { camelCaseToTitleCase, removeDuplicates, toDict } from "@/lib/client/ClientUtils";

test("camelCaseToTitleCase", () => {
  expect(camelCaseToTitleCase("notLinkedToTba")).toBe("Not Linked To Tba");
});

test("toDict", () => {
  const array = [
    { _id: "1", name: "one" },
    { _id: "2", name: "two" },
    { _id: "3", name: "three" }
  ]

  const dict = {
    "1": { _id: "1", name: "one" },
    "2": { _id: "2", name: "two" },
    "3": { _id: "3", name: "three" }
  }

  expect(toDict(array)).toEqual(dict);
});

test("removeDuplicates: 1D array", () => {
  const arr = [1, 2, 3, 4, 1, 2, 3, 4, 5];
  expect(removeDuplicates(arr)).toEqual([1, 2, 3, 4, 5]);
});

test("removeDuplicates: 2D array", () => {
  const arr = [[1, 2], [3, 4], [1, 2], [3, 4], [5]];
  expect(removeDuplicates(arr)).toEqual([1, 2, 3, 4, 5]);
});