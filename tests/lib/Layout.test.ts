import { Defense, FrcDrivetrain, FtcDrivetrain } from "@/lib/Enums";
import { FormElement, keyToType } from "@/lib/Layout";
import { League } from "@/lib/Types";

test(`${keyToType.name}: Returns correct types`, () => {
  const exampleData = {
    "image": "image",
    "text": "string",
    "number": 1,
    "boolean": true,
    "startingPos": { x: 0, y: 0 },
    "Defense": Defense.Full
  };

  const types = Object.keys(exampleData).map(key => keyToType(League.FRC, key, exampleData));

  expect(types).toEqual([
    "image",
    "string",
    "number",
    "boolean",
    "object",
    Defense
  ]);
});

test(`${keyToType.name}: Chooses FrcDrivetrain or FtcDrivetrain correctly`, () => {
  expect(keyToType(League.FRC, "FrcDrivetrain", { "FrcDrivetrain": "Tank" })).toBe(FrcDrivetrain);
  expect(keyToType(League.FTC, "FtcDrivetrain", { "FtcDrivetrain": "Tank" })).toBe(FtcDrivetrain);
});

test(`${FormElement.name}.${FormElement.fromProps.name}: From key`, () => {
  const exampleData = {
    "text": "string"
  };

  const element = FormElement.fromProps(League.FRC, "text", exampleData);

  expect(element.key).toBe("text");
  expect(element.label).toBe("Text");
  expect(element.type).toBe("string");
});

test(`${FormElement.name}.${FormElement.fromProps.name}: From props`, () => {
  const exampleData = {
    "number": 1
  };

  const element = FormElement.fromProps(League.FRC, { key: "number", label: "Number", type: "number" }, exampleData);

  expect(element.key).toBe("number");
  expect(element.label).toBe("Number");
  expect(element.type).toBe("number");
});