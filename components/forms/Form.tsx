import { AllianceColor, Report, QuantitativeFormData, QuantitativeReportLayout, QuantitativeReportLayoutElement, QuantitativeReportLayoutElementHolder } from "@/lib/Types";
import { useCallback, useState, useEffect } from "react";
import FormPage from "./FormPages";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { TfiReload } from "react-icons/tfi";

import ClientAPI from "@/lib/client/ClientAPI";
import Checkbox from "./Checkboxes";
import { camelCaseToTitleCase } from "@/lib/client/ClientUtils";
import StartingPosition from "./StartingPosition";
import { CommentBox } from "./Comment";
import { IncrementButton } from "./Buttons";
import Slider from "./Sliders";
import { IntakeTypes, Defense, Drivetrain } from "@/lib/Enums";

const api = new ClientAPI("gearboxiscool");

export default function Form(props: { report: Report, layout: QuantitativeReportLayout<QuantitativeFormData>, fieldImagePrefix: string }) {
  const { session, status } = useCurrentSession();

  const [page, setPage] = useState(0);
  const [formData, setFormData] = useState<QuantitativeFormData>(props.report?.data);
  const [syncing, setSyncing] = useState(false);

  const alliance = props.report?.color;

  async function submitForm() {
    await api.submitForm(props.report?._id, formData, session?.user?._id);
    console.log("yaya");
    location.href = location.href.substring(0, location.href.lastIndexOf("/"));
  }

  const sync = async () => {
    setSyncing(true);
    await api.updateReport({ data: formData }, props.report?._id);
    setSyncing(false);
  };

  const setCallback = useCallback(
    (key: any, value: boolean | string | number) => {
      setFormData((old) => {
        let copy = structuredClone(old);
        copy[key] = value;
        sync();
        return copy;
      });
    },
    []
  );

  useCallback(() => {
    // Set all Nan values to 0
    for (const key in formData) {
      if (typeof formData[key] === "number" && isNaN(formData[key])) {
        setCallback(key, 0);
      }
    }

    setFormData(formData);
  }, [props.report?.data]);

  function getLayoutElement(original: QuantitativeReportLayoutElementHolder<QuantitativeFormData>) {
    const element: typeof original = {
      key: original as string,
      label: camelCaseToTitleCase(original as string),
    };

    // Copy over the rest of the properties
    if (typeof original === "object") {
      if (Array.isArray(original)) {
        const originalBlock = original as (keyof QuantitativeFormData | QuantitativeReportLayoutElement<QuantitativeFormData>)[][];
        const newBlock: QuantitativeReportLayoutElement<QuantitativeFormData>[][] = [];

        for (let r = 0; r < originalBlock.length; r++) {
          const row = [];
          for (let c = 0; c < originalBlock[r].length; c++) {
            row.push(getLayoutElement(originalBlock[r][c]) as QuantitativeReportLayoutElement<QuantitativeFormData>);
          }
          newBlock.push(row);
        }

        return newBlock;
      }

      for (const key in original) {
          element[key] = (original as QuantitativeReportLayoutElement<QuantitativeFormData>)[key];
      }
    }

    if (!element.type) {
      const rawType = typeof formData[element.key];

      if (rawType !== "string")
        element.type = rawType;
      else {
        const enums = [IntakeTypes, Defense, Drivetrain];

        if (element.key === "Defense")
          element.type = Defense;
        else {
          for (const e of enums) {
            if (Object.values(e).includes(formData[element.key])) {
              element.type = e;
              break;
            }
          }
        }

        if (!element.type)
          element.type = "string";
      }
    }

    return element;
  }

  function elementToNode(element: QuantitativeReportLayoutElement<QuantitativeFormData>) {
    if (element.type === "boolean") {
      return (
        <Checkbox
          label={element.label ?? element.key as string}
          dataKey={element.key as string}
          data={formData}
          callback={setCallback}
        />
      );
    }

    if (element.type === "startingPos") {
      return (
        <StartingPosition
          alliance={alliance}
          data={formData}
          callback={setCallback}
          fieldImagePrefix={props.fieldImagePrefix}
        />
      );
    }

    if (element.type === "number") {
      return (
        <input
          type="number"
          value={formData[element.key as string] as number}
          onChange={(e) => {
            setCallback(element.key as string, parseInt(e.target.value));
          }}
        />
      );
    }

    if (element.type === "string") {
      return (
        <CommentBox data={formData} callback={setCallback} />
      );
    }

    // Enum
    if (element.type) {
      return (
        <Slider data={formData} callback={setCallback} possibleValues={element.type} 
          title={element.label ?? camelCaseToTitleCase(element.key as string)} value={formData[element.key]}
          key={element.key} />
      );
    }
  }

  function blockToNode(block: QuantitativeReportLayoutElementHolder<QuantitativeFormData>[][]) {
    const colCount = block.length;
    const rowCount = block[0].length;

    const elements = [];

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        let rounding = "";
        if (r === 0) rounding += "t";
        else if (r === rowCount - 1) rounding += "b";

        if (c === 0) rounding += "l";
        else if (c === colCount - 1) rounding += "r";

        // Just having rounded-t will cause side effects
        if (rounding.length === 1)
          rounding = "";

        const element = block[c][r] as QuantitativeReportLayoutElement<QuantitativeFormData>;

        elements.push(<IncrementButton dataKey={element.key as string} data={formData} 
          text={element.label ?? element.key as string} callback={setCallback} rounded={rounding}/>);
      }
    }

    return (
      <div className="w-full h-full flex flex-col items-center">
        <div className={`w-full grid grid-cols-${colCount} grid-rows-${rowCount}`}>
          {elements}
        </div>
      </div>
    );
  }

  // Use an array to preserve the order of pages
  const layout: { page: string, elements: QuantitativeReportLayoutElementHolder<QuantitativeFormData>[] }[] = [];
  Object.entries(props.layout).map(([key, value]) => {
    layout.push({ page: key, elements: value.map((key) => getLayoutElement(key)) });
  });

  const pages = layout.map((page, index) => {
    const inputs = page.elements.map((element) => {
      return Array.isArray(element) ? blockToNode(element) : elementToNode(element as QuantitativeReportLayoutElement<QuantitativeFormData>);
    });

    return (
      <FormPage key={"form"} title={page.page}>
        {inputs}
        {
          index === layout.length - 1 && (<>
            <hr className="w-full border-slate-700 border-2"></hr>
            <button className="btn btn-wide btn-primary " onClick={submitForm}>
              Submit
            </button>
            </>)
        }
      </FormPage>
    );
  });

  return (
    <div className="w-full h-fit flex flex-col items-center space-y-2 mb-2">
      {pages[page]}
      <div className="w-full h-full">
        <div className="card w-full bg-base-200">
          <div className="card-body flex flex-col items-center">
            <h2
              className={`${
                alliance === AllianceColor.Blue
                  ? "text-blue-500"
                  : "text-red-500"
              } font-bold text-5xl`}
            >
              #{[props.report.robotNumber]}
            </h2>
            <div className="card-actions justify-between w-full">
              <button
                className="btn btn-primary"
                disabled={page === 0}
                onClick={() => {
                  setPage(page - 1);
                }}
              >
                <FaArrowLeft />
                Back
              </button>

              {syncing ? (
                <p className="mt-3 text-sm md:text-md text-center">
                  {" "}
                  <TfiReload className="animate-spin inline-block"></TfiReload>{" "}
                  Syncing Changes
                </p>
              ) : (
                <></>
              )}

              <button
                className="btn btn-primary"
                disabled={page === 3}
                onClick={() => {
                  setPage(page + 1);
                }}
              >
                Next
                <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
