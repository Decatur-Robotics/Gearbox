import { Defense } from "@/lib/Enums";
import { FormElement, keyToType } from "@/lib/Layout";

test(keyToType.name, () => {
  const exampleData = {
    "image": "image",
    "text": "string",
    "number": 1,
    "boolean": true,
    "startingPos": { x: 0, y: 0 },
    "Defense": Defense.Full
  };

  const types = Object.keys(exampleData).map(key => keyToType(key, exampleData));

  expect(types).toEqual([
    "image",
    "string",
    "number",
    "boolean",
    "object",
    Defense
  ]);
});

test(`${FormElement.name}.${FormElement.fromProps.name}: From Key`, () => {
  const exampleData = {
    "text": "string"
  };

  const element = FormElement.fromProps("text", exampleData);

  expect(element.key).toBe("text");
  expect(element.label).toBe("Text");
  expect(element.type).toBe("string");
});

test(`${FormElement.name}.${FormElement.fromProps.name}: From Props`, () => {
  const exampleData = {
    "number": 1
  };

  const element = FormElement.fromProps({ key: "number", label: "Number", type: "number" }, exampleData);

  expect(element.key).toBe("number");
  expect(element.label).toBe("Number");
  expect(element.type).toBe("number");
});