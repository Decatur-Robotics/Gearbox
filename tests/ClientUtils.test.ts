import { camelCaseToTitleCase, removeDuplicates, removeWhitespaceAndMakeLowerCase, rotateArray, toDict } from "@/lib/client/ClientUtils";
import { HasId } from "@/lib/Types";
import { ObjectId } from "bson";

test(camelCaseToTitleCase.name, () => {
  expect(camelCaseToTitleCase("notLinkedToTba")).toBe("Not Linked To Tba");
});

test(toDict.name, () => {
  const array = [
    { _id: new ObjectId(), name: "one" },
    { _id: new ObjectId(), name: "two" },
    { _id: new ObjectId(), name: "three" }
  ]

  const dict: { [_id: string]: HasId & { name: string } } = {};
  array.forEach((item) => {
    dict[item._id.toString()] = item;
  });

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