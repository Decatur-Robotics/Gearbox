import { camelCaseToTitleCase } from "./client/ClientUtils";
import { IntakeTypes, Defense, Drivetrain } from "./Enums";

type StringKeyedObject = { [key: string]: any };

export type ElementType = "string" | "number" | "boolean" | "image" | "startingPos" | Object;

export type LayoutElementProps<TData extends StringKeyedObject> = string | {
  key: keyof TData;
  label?: string;
  type?: ElementType;
}

export class LayoutElement<TData extends StringKeyedObject> {
  key: keyof TData;
  label: string;
  type?: ElementType

  constructor(key: keyof TData, dataExample: TData, label?: string, type?: ElementType) {
    this.key = key;
    this.label = label ?? camelCaseToTitleCase(key as string);
    this.type = type ?? getType(key as string, dataExample);
  }

  static fromProps<TData extends StringKeyedObject>(props: LayoutElementProps<TData>, dataExample: TData): LayoutElement<TData> {
    if (typeof props === "string")
      return new LayoutElement(props, dataExample);
    return new LayoutElement(props.key, dataExample, props.label, props.type);
  }
}

export type BlockElementProps<TData extends StringKeyedObject> = LayoutElementProps<TData>[][];

export class BlockElement<TData extends StringKeyedObject> {
  elements: LayoutElement<TData>[][];

  constructor(elements: LayoutElementProps<TData>[][], dataExample: TData) {
    this.elements = elements.map(c => c.map(e => LayoutElement.fromProps(e, dataExample)));
  }
}

export type FormLayoutProps<TData extends StringKeyedObject> = { [header: string]: LayoutElementProps<TData>[]};

export class FormLayout<TData extends StringKeyedObject> {
  [header: string]: (LayoutElement<TData> | BlockElement<TData>)[];

  constructor(elements: (LayoutElementProps<TData> | BlockElementProps<TData>)[], dataExample: TData) {
    this.elements = elements.map(e => {
      if (Array.isArray(e))
        return new BlockElement(e, dataExample);
      return LayoutElement.fromProps(e, dataExample);
    });
  }

  static fromProps<TData extends StringKeyedObject>(props: FormLayoutProps<TData>, dataExample: TData): FormLayout<TData> {
    const layout = new FormLayout([], dataExample);
    for (const header in props) {
      layout[header] = props[header].map(e => LayoutElement.fromProps(e, dataExample));
    }

    return layout;
  }
}

export function getType(key: string, exampleData: StringKeyedObject): ElementType {
  if (key === "image")
    return "image";

  const type = typeof exampleData[key];
  if (type !== "string")
    return type as ElementType;

  const enums = [IntakeTypes, Defense, Drivetrain];
  if (key === "Defense")
    return Defense;

  for (const e of enums) {
    if (Object.values(e).includes(exampleData[key]))
      return e;
  }

  return "string";
}