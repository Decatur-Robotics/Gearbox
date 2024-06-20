import { camelCaseToTitleCase } from "./client/ClientUtils";
import { IntakeTypes, Defense, Drivetrain } from "./Enums";

type StringKeyedObject = { [key: string]: any };

export type ElementType = "string" | "number" | "boolean" | "image" | "startingPos" | Object;

export type LayoutElementProps<TData extends StringKeyedObject> = string | {
  key: keyof TData;
  label: string;
}

export class LayoutElement<TData extends StringKeyedObject> {
  key: keyof TData;
  label: string;
  type?: ElementType

  constructor(key: keyof TData, dataExample: TData, label?: string) {
    this.key = key;
    this.label = label ?? camelCaseToTitleCase(key as string);

    const type = typeof dataExample[key];
    if (type !== "string")
      this.type = type as ElementType;
    else {
      const enums = [IntakeTypes, Defense, Drivetrain];
      if (key === "Defense")
        this.type = Defense;
      else {
        for (const e of enums) {
          if (Object.values(e).includes(dataExample[key])) {
            this.type = e;
            break;
          }
        }
      }

      if (!this.type)
        this.type = "string";
    }
  }

  static fromProps<TData extends StringKeyedObject>(props: LayoutElementProps<TData>, dataExample: TData): LayoutElement<TData> {
    if (typeof props === "string")
      return new LayoutElement(props, dataExample);
    else
      return new LayoutElement(props.key, dataExample, props.label);
  }
}

export type FormLayoutProps<TData extends StringKeyedObject> = { [header: string]: LayoutElementProps<TData>[]};

export class FormLayout<TData extends StringKeyedObject> {
  [header: string]: LayoutElement<TData>[];

  constructor(elements: LayoutElementProps<TData>[], dataExample: TData) {
    this.elements = elements.map(e => LayoutElement.fromProps(e, dataExample));
  }

  static fromProps<TData extends StringKeyedObject>(props: FormLayoutProps<TData>, dataExample: TData): FormLayout<TData> {
    const layout = new FormLayout([], dataExample);
    for (const header in props) {
      layout[header] = props[header].map(e => LayoutElement.fromProps(e, dataExample));
    }

    return layout;
  }
}