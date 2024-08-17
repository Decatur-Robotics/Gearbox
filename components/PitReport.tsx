import ClientAPI from "@/lib/client/ClientAPI";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { FormLayout, FormElement, BlockElement } from "@/lib/Layout";
import { Pitreport, PitReportData } from "@/lib/Types";
import { useState, useCallback, Fragment } from "react";
import { FaRobot } from "react-icons/fa";
import Flex from "./Flex";
import Checkbox from "./forms/Checkboxes";
import ImageUpload from "./forms/ImageUpload";
import Card from "./Card";
import { getCompFromLocalStorage, updateCompInLocalStorage } from "@/lib/client/offlineUtils";
import QRCode from "react-qr-code";
import { Analytics } from "@/lib/client/Analytics";
import QrCode from "./QrCode";

const api = new ClientAPI("gearboxiscool");

export default function PitReportForm(props: { pitReport: Pitreport, layout: FormLayout<PitReportData>, compId?: string, 
    usersteamNumber?: number, compName?: string, username?: string }) {
  const { session } = useCurrentSession();

  const [pitreport, setPitreport] = useState(props.pitReport);

  const setCallback = useCallback(
    (key: any, value: boolean | string | number) => {
      setPitreport((old) => {
        let copy = structuredClone(old);
        //@ts-expect-error
        copy.data[key] = value;
        return copy;
      });
    },
    []
  );

  async function submit() {
    // Remove _id from object
    const { _id, ...report } = pitreport;

    console.log("Submitting pitreport", report);
    api.updatePitreport(props.pitReport?._id, {
      ...report,
      submitted: true,
      submitter: session?.user?._id
    })
    .catch((e) => {
      console.error("Error submitting pitreport", e);

      if (!props.compId || !pitreport._id) return;

      updateCompInLocalStorage(props.compId, (comp) => {
        if (!pitreport._id) {
          console.error("Pitreport has no _id");
          return;
        }

        console.log("Updating pitreport in local storage");

        comp.pitReports[pitreport._id] = {
          ...pitreport,
          submitted: true,
          submitter: session?.user?._id
        };
      });
    })
    .then(() => {
      Analytics.pitReportSubmitted(pitreport.teamNumber, props.usersteamNumber ?? -1, props.compName ?? "Unknown", props.username ?? "Unknown");
    })
    .finally(() => {
      location.href = location.href.substring(0, location.href.lastIndexOf("/pit"));
    });
  }

  function getComponent(element: FormElement<PitReportData>, isLastInHeader: boolean, index: number) {
    const key = element.key as string;

    if (element.type === "image")
      return <ImageUpload key={index} report={pitreport} callback={setCallback} />

    if (element.type === "boolean")
      return <Checkbox key={index} label={element.label ?? element.key as string} dataKey={key} data={pitreport} callback={setCallback} 
        divider={!isLastInHeader} />

    if (element.type === "number")
      // <Fragement> lets us the key attribute on a <> element
      return (<Fragment key={index}>
        <h1 key={key + "h"} className="font-semibold text-lg">{element.label}</h1>
        <input
          key={key + "i"}
          value={pitreport.data?.[key]}
          onChange={(e) => setCallback(key, e.target.value)}
          type="number"
          className="input input-bordered"
          placeholder={element.label}
        />
      </Fragment>);

    if (element.type === "string")
      return (
        <textarea
          key={key}
          value={pitreport.data?.comments}
          className="textarea textarea-primary w-[90%]"
          placeholder="Say Something Important..."
          onChange={(e) => {
            setCallback("comments", e.target.value);
          }}
        />
      );

    const entries = Object.entries(element.type!).map((entry, index) => {
      const color = ["primary", "accent", "secondary"][index % 3];

      return (
        <Fragment key={index}>
          <span key={key + index + "s"}>{entry[0]}</span>
          <input
            key={key + index + "i"}
            type="radio"
            className={`radio radio-${color}`}
            onChange={() =>
              setCallback(key, entry[1] as boolean | string | number)
            }
            checked={pitreport.data?.[element.key as string] === entry[1]}
          />
        </Fragment>
      );
    });

    return (<Fragment key={index}>
      <h1 key={key + "h"} className="font-semibold text-lg">{element.label}</h1>
      <div key={key + "d"} className="grid grid-cols-2 translate-x-6 space-y-1">{entries}</div>
    </Fragment>);
  }

  const components = Object.entries(props.layout).map(([header, elements]) => {
    const inputs = elements.map((element, index) => {
      if (!Array.isArray(element))
        return getComponent(element as FormElement<PitReportData>, index === elements.length - 1, index);

      const block = element as BlockElement<PitReportData>;
      return block?.map((row) =>
        row.map((element, elementIndex) =>
          getComponent(element, elementIndex === row.length - 1, index)
        )
      );
    });

    return (
      <div key={header}>
        <h1 key={header + "h"} className="font-semibold text-lg">{header}</h1>
        <div key={header + "d"} className="translate-x-10">
          {inputs}
        </div>
      </div>
    );
  });

  return (
    <Flex mode="col" className="items-center w-screen h-full space-y-4">
      <Card className="w-1/4" coloredTop="bg-accent">
        <Flex center={true} mode="col">
          <h1 className="text-4xl font-semibold">Pitscouting</h1>
          <div className="divider"></div>
          <h1 className="font-semibold text-2xl">
            <FaRobot className="inline mr-2" size={30}></FaRobot>
            Team <span className="text-accent">{pitreport.teamNumber}</span>
          </h1>
        </Flex>
      </Card>
      <Card>
        {components}
        <button className="btn btn-primary " onClick={submit}>
          Submit
        </button>
      </Card>
      <Card title="Share while offline">
        <div className="w-full flex justify-center">
          <QrCode value={JSON.stringify({
            pitReport: {
              ...pitreport,
              submitted: true,
              submitter: session?.user?._id
            }
          })} />
        </div>
      </Card>
    </Flex>
  );
}