import { AllianceColor, Report, QuantData } from "@/lib/Types";
import { useCallback, useState } from "react";
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
import { BlockElement, FormLayout, FormElement } from "@/lib/Layout";
import { updateCompInLocalStorage } from "@/lib/client/offlineUtils";
import Loading from "../Loading";
import QRCode from "react-qr-code";
import Card from "../Card";

const api = new ClientAPI("gearboxiscool");

export default function Form(props: { report: Report, layout: FormLayout<QuantData>, fieldImagePrefix: string, compId?: string | undefined }) {
  const { session, status } = useCurrentSession();

  const [page, setPage] = useState(0);
  const [formData, setFormData] = useState<QuantData>(props.report?.data);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const alliance = props.report?.color;

  async function submitForm() {
    setSubmitting(true);

    try {
      await api.submitForm(props.report?._id, formData, session?.user?._id);
      if (location.href.includes("offline"))
        location.href = `/offline/${props.compId}`;
      else
        location.href = location.href.substring(0, location.href.lastIndexOf("/"));
    }
    catch (e) {
      console.error(e);

      if (props.compId) {
        updateCompInLocalStorage(props.compId, (comp) => {
          const report = comp.quantReports[props.report._id ?? ""]

          report.data = formData;
          report.submitted = true;

          return comp;
        });

        location.href = `/offline/${props.compId}`;
      }

      setSubmitting(false);
    }
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

  function elementToNode(element: FormElement<QuantData>) {
    const key = element.key as string;

    if (element.type === "boolean") {
      return (
        <Checkbox
          label={element.label ?? camelCaseToTitleCase(key)}
          dataKey={key}
          data={formData}
          callback={setCallback}
          key={key}
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
          key={key}
        />
      );
    }

    if (element.type === "number") {
      return (
        <input
          type="number"
          value={formData[key] as number}
          onChange={(e) => {
            setCallback(key, parseInt(e.target.value));
          }}
          key={key}
        />
      );
    }

    if (element.type === "string") {
      return (
        <CommentBox data={formData} callback={setCallback} key={key} />
      );
    }

    // Enum
    if (typeof element.type === "object") {
      return (
        <Slider data={formData} callback={setCallback} possibleValues={element.type} 
          title={element.label ?? camelCaseToTitleCase(key)} value={formData[element.key]}
          dataKey={element.key} key={key} />
      );
    }
  }

  function blockToNode(block: BlockElement<QuantData>) {
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

        if (!BlockElement.isBlock(block[c][r])) {
          const element = block[c][r] as FormElement<QuantData>;

          elements.push(<IncrementButton dataKey={element.key as string} data={formData} 
            text={element.label ?? element.key as string} callback={setCallback} rounded={rounding}/>);
        }
      }
    }

    return (
      <div key={block.map(e => e.keys).join(",")} className="w-full h-full flex flex-col items-center">
        <div className={`w-full grid grid-cols-${colCount} grid-rows-${rowCount}`}>
          {elements}
        </div>
      </div>
    );
  }

  // Use an array to preserve the order of pages
  const layout: { page: string, elements: (FormElement<QuantData> | BlockElement<QuantData>)[] }[] = [];
  Object.entries(props.layout).map(([header, elements]) => {
    layout.push({ page: header, elements });
  });

  const pages = layout.map((page, index) => {
    const inputs = page.elements.map((element) => {
      return BlockElement.isBlock(element) ? blockToNode(element) : elementToNode(element as FormElement<QuantData>);
    });

    return (
      <FormPage key={"form"} title={page.page}>
        {inputs}
      </FormPage>
    );
  });

  pages.push(
    <FormPage key={"form"} title={"Submit"}>
      <button className={`btn btn-wide btn-${submitting ? "disabled" : "primary"} text-xl mb-6`} onClick={submitForm}>
        {submitting ? <Loading bg="" size={8} /> : "Submit"}
      </button>
      <Card className="justify-center w-fit bg-base-300" title="Share while offline">
        <QRCode value={JSON.stringify({
          quantReport: {
            ...props.report,
            data: formData,
            submitted: true
          }
        })} />
      </Card>
    </FormPage>
  );

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
                disabled={page === pages.length - 1}
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
