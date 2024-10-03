import { camelCaseToTitleCase, removeDuplicates, removeWhitespaceAndMakeLowerCase, rotateArray, toDict } from "@/lib/client/ClientUtils";

test(camelCaseToTitleCase.name, () => {
  expect(camelCaseToTitleCase("notLinkedToTba")).toBe("Not Linked To Tba");
});

test(toDict.name, () => {
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

test(`${removeDuplicates.name}: 1D array`, () => {
  const arr = [1, 2, 3, 4, 1, 2, 3, 4, 5];
  expect(removeDuplicates(arr)).toEqual([1, 2, 3, 4, 5]);
});

test(`${removeDuplicates.name}: 2D array`, () => {
  const arr = [[1, 2], [3, 4], [1, 2], [3, 4], [5]];
  expect(removeDuplicates(arr)).toEqual([1, 2, 3, 4, 5]);
});

test(`${removeDuplicates.name}: Not In Place`, () => {
  const arr = [1, 2, 3, 4, 5, 1, 2, 3, 4];
  const original = arr.slice();
  removeDuplicates(arr);
  expect(arr).toEqual(original);
});

test(rotateArray.name, () => {
  const arr = [1, 2, 3, 4, 5];
  rotateArray(arr);
  expect(arr).toEqual([2, 3, 4, 5, 1]);
});

test(removeWhitespaceAndMakeLowerCase.name, () => {
  expect(removeWhitespaceAndMakeLowerCase("Hello World")).toBe("helloworld");
  expect(removeWhitespaceAndMakeLowerCase("Hello World ")).toBe("helloworld");
  expect(removeWhitespaceAndMakeLowerCase(" Hello World")).toBe("helloworld");
  expect(removeWhitespaceAndMakeLowerCase(" Hello  World ")).toBe("helloworld");
});