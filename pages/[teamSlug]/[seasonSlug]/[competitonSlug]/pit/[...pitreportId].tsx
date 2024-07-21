import { Collections, getDatabase } from "@/lib/MongoDB";
import { PitReportData, Pitreport } from "@/lib/Types";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import UrlResolver, { SerializeDatabaseObject } from "@/lib/UrlResolver";

import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useCallback, useState } from "react";
import Checkbox, {
} from "@/components/forms/Checkboxes";
import ClientAPI from "@/lib/client/ClientAPI";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import { FaRobot } from "react-icons/fa";
import ImageUpload from "@/components/forms/ImageUpload";
import { games } from "@/lib/games";
import { GameId } from "@/lib/client/GameId";
import { makeObjSerializeable } from "@/lib/client/ClientUtils";
import { BlockElement, FormLayout, FormElement } from "@/lib/Layout";

const api = new ClientAPI("gearboxiscool");

export default function PitreportForm(props: { pitreport: Pitreport, layout: FormLayout<PitReportData> }) {
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  const [pitreport, setPitreport] = useState(props.pitreport);

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

    await api.updatePitreport(props.pitreport?._id, {
      ...report,
      submitted: true,
      submitter: session.user?._id
    });
    location.href = location.href.substring(
      0,
      location.href.lastIndexOf("/pit")
    );
  }

  function getComponent(element: FormElement<PitReportData>, isLastInHeader: boolean) {
    const key = element.key as string;

    if (element.type === "image")
      return <ImageUpload report={pitreport} callback={setCallback} />

    if (element.type === "boolean")
      return <Checkbox label={element.label ?? element.key as string} dataKey={key} data={pitreport} callback={setCallback} 
        divider={!isLastInHeader} />

    if (element.type === "number")
      return (<>
        <h1 className="font-semibold text-lg">{element.label}</h1>
        <input
          value={pitreport.data?.[key]}
          onChange={(e) => setCallback(key, e.target.value)}
          type="number"
          className="input input-bordered"
          placeholder={element.label}
        />
      </>);

    if (element.type === "string")
      return (
        <textarea
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
        <>
          <span>{entry[0]}</span>
          <input
            type="radio"
            className={`radio radio-${color}`}
            onChange={() =>
              setCallback(key, entry[1] as boolean | string | number)
            }
            checked={pitreport.data?.[element.key as string] === entry[1]}
          />
        </>
      );
    });

    return (<>
      <h1 className="font-semibold text-lg">{element.label}</h1>
      <div className="grid grid-cols-2 translate-x-6 space-y-1">{entries}</div>
    </>);
  }

  const components = Object.entries(props.layout).map(([header, elements]) => {
    const inputs = elements.map((element, index) => {
      if (!Array.isArray(element))
        return getComponent(element as FormElement<PitReportData>, index === elements.length - 1);

      const block = element as BlockElement<PitReportData>;
      return block?.map((row, rowIndex) =>
        row.map((element, elementIndex) =>
          getComponent(element, elementIndex === row.length - 1)
        )
      );
    });

    return (
      <div key={header}>
        <h1 className="font-semibold text-lg">{header}</h1>
        <div className="translate-x-10">
          {inputs}
        </div>
      </div>
    );
  });

  return (
    <Container requireAuthentication={false} hideMenu={!hide}>
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
      </Flex>
    </Container>
  );
}

async function getPitreport(id: string) {
  const db = await getDatabase();
  return await db.findObjectById<Pitreport>(
    Collections.Pitreports,
    new ObjectId(id)
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.resolvedUrl.split("/pit/")[1];
  const pitreport = await getPitreport(id);

  const urlData = await UrlResolver(context);
  const game = games[urlData.season?.gameId ?? GameId.Crescendo];

  return {
    props: { 
      pitreport: SerializeDatabaseObject(pitreport),
      layout: makeObjSerializeable(game.pitReportLayout)
     },
  };
};
