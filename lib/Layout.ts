import { camelCaseToTitleCase } from "./client/ClientUtils";
import { IntakeTypes, Defense, Drivetrain, Motors, SwerveLevel, CenterStageEnums } from "./Enums";
import { PitReportData, QuantData, Pitreport, Report } from "./Types";

type StringKeyedObject = { [key: string]: any };

export type ElementType = "string" | "number" | "boolean" | "image" | "startingPos" | Object;

export type FormElementProps<TData extends StringKeyedObject> = string | {
  key: keyof TData;
  label?: string;
  type?: ElementType;
}

export class FormElement<TData extends StringKeyedObject> {
  key: keyof TData;
  label: string;
  type?: ElementType

  constructor(key: keyof TData, dataExample: TData, label?: string, type?: ElementType) {
    this.key = key;
    this.label = label ?? camelCaseToTitleCase(key as string);
    this.type = type ?? getType(key as string, dataExample);
  }

  /**
   * @tested_by Layout.test.ts
   */
  static fromProps<TData extends StringKeyedObject>(props: FormElementProps<TData>, dataExample: TData): FormElement<TData> {
    if (typeof props === "string")
      return new FormElement(props, dataExample);
    return new FormElement(props.key, dataExample, props.label, props.type);
  }
}

export type BlockElementProps<TData extends StringKeyedObject> = FormElementProps<TData>[][];

export class BlockElement<TData extends StringKeyedObject> extends Array<Array<FormElement<TData>>> {
  constructor(elements: BlockElementProps<TData>, dataExample: TData) {
    const genElements = elements.map(c => c.map(e => FormElement.fromProps(e, dataExample)));
    super(...genElements);
  }

  static isBlock(element: FormElement<any> | BlockElement<any>): element is BlockElement<any> {
    return Array.isArray(element);
  }
}

export type FormLayoutProps<TData extends StringKeyedObject> = 
  { [header: string]: (FormElementProps<TData> | BlockElementProps<TData>)[]};

export class FormLayout<TData extends StringKeyedObject> {
  [header: string]: (FormElement<TData> | BlockElement<TData>)[];

  static fromProps<TData extends StringKeyedObject>(props: FormLayoutProps<TData>, dataExample: TData): FormLayout<TData> {
    const layout = new FormLayout<TData>();
    for (const header in props) {
      layout[header] = props[header].map(e => {
        if (!Array.isArray(e))
          return FormElement.fromProps(e, dataExample);
        return new BlockElement(e, dataExample);
      });
    }

    return layout;
  }
}

/**
 * @tested_by Layout.test.ts
 */
export function getType(key: string, exampleData: StringKeyedObject): ElementType {
  if (key === "image")
    return "image";

  const type = typeof exampleData[key];
  if (type !== "string")
    return type as ElementType;

  const enums = [
    IntakeTypes, Defense, Drivetrain, Motors, SwerveLevel, 
    CenterStageEnums.CenterStageParkingLocation, CenterStageEnums.AutoAdjustable, CenterStageEnums.AutoSidePreference
  ];

  if (key === "Defense")
    return Defense;
  if (key === "swerveLevel")
    return SwerveLevel;

  for (const e of enums) {
    if (Object.values(e).includes(exampleData[key]))
      return e;
  }

  return "string";
}

export type Badge = {
  text: string;
  color: "primary" | "secondary" | "accent" | "success" | "warning" | "info";
}

export type Stat<TPitData extends PitReportData, TQuantData extends QuantData> = {
  label: string;
  key?: keyof TPitData | keyof TQuantData | undefined;
  get?: (pitData: Pitreport<TPitData> | undefined, quantitativeReports: Report<TQuantData>[] | undefined) => number;
}

export type StatPair<TPitData extends PitReportData, TQuantData extends QuantData> = {
  stats: Stat<TPitData, TQuantData>[];
  label: string;
}

export type StatsLayout<TPitData extends PitReportData, TQuantData extends QuantData> = {
  [header: string]: (Stat<TPitData, TQuantData> | StatPair<TPitData, TQuantData>)[];
}

export type PitStatsLayout<TPitData extends PitReportData, TQuantData extends QuantData> = {
  [key: string]: Stat<TPitData, TQuantData> | Stat<TPitData, TQuantData>[];

  overallSlideStats: Stat<TPitData, TQuantData>[];
  individualSlideStats: Stat<TPitData, TQuantData>[];
  robotCapabilities: Stat<TPitData, TQuantData>[];
  graphStat: Stat<TPitData, TQuantData>;
}