import { MinimumNameLength, validEmail, validName } from "@/lib/client/InputVerification";

test(`${validName.name}: No Names < ${MinimumNameLength} Characters`, () => {
  let name = "a".repeat(MinimumNameLength - 1);
  expect(validName(name)).toBe(false);
  expect(validName(name+"a")).toBe(true);
});

test(`${validName.name}: Alphanumeric Only`, () => {
  let name = "a".repeat(MinimumNameLength);
  expect(validName(name)).toBe(true);
  expect(validName(name+"1")).toBe(true);
  expect(validName(name+"!")).toBe(false);
  expect(validName(name+" ")).toBe(false);
});

test(`${validName.name}: Allow Spaces`, () => {
  let name = "a".repeat(MinimumNameLength);
  expect(validName(name+" ")).toBe(false);
  expect(validName(name+" ", true)).toBe(true);
});

test(validEmail.name, () => {
  expect(validEmail("notanemail")).toBe(false);
  expect(validEmail("notanemail@")).toBe(false);
  expect(validEmail("notanemail@.")).toBe(false);
  expect(validEmail("notanemail@.com")).toBe(false);
  expect(validEmail("notanemail@.com.")).toBe(false);
  expect(validEmail("notanemail@.com.com")).toBe(false);
  expect(validEmail("anemail@com.com")).toBe(true);
});