import { Collections, getDatabase } from "@/lib/MongoDB";
import { Drivetrain, Game, IntakeTypes, Motors, PitReportLayout, PitReportLayoutElement, Pitreport, SwerveLevel } from "@/lib/Types";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import UrlResolver, { ResolvedUrlData, SerializeDatabaseObject } from "@/lib/UrlResolver";

import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useCallback, useEffect, useState } from "react";
import Checkbox, {
  DrivetrainType,
  IntakeType,
} from "@/components/forms/Checkboxes";
import { CommentBox } from "@/components/forms/Comment";
import ClientAPI from "@/lib/client/ClientAPI";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import { FaRobot } from "react-icons/fa";
import ImageUpload from "@/components/forms/ImageUpload";
import { Crescendo, games } from "@/lib/games";
import { GameId } from "@/lib/client/GameId";

const api = new ClientAPI("gearboxiscool");

export default function PitreportForm(props: { pitreport: Pitreport, layout: PitReportLayout<any> }) {
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

  function getComponent(key: string | PitReportLayoutElement<any>, isLastInHeader: boolean) {
    const element = getLayoutElement(key);

    if (typeof key === "object")
      key = key.key as string;

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
              setCallback(key, entry[1])
            }
            checked={pitreport.data?.[key] === entry[1]}
          />
        </>
      );
    });

    return (<>
      <h1 className="font-semibold text-lg">{element.label}</h1>
      <div className="grid grid-cols-2 translate-x-6 space-y-1">{entries}</div>
    </>);
  }

  function camelCaseToTitleCase(str: string) {
    return str
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  }

  function getLayoutElement(key: string | PitReportLayoutElement<any>) {
    const element: PitReportLayoutElement<any> = {
      key: key as string,
      label: undefined,
      type: undefined
    }

    const value = pitreport.data?.[key as string];
    const rawType = typeof value;

    if (typeof key === "object") {
      // Copy over the values that do exist
      for (const [k, v] of Object.entries(key)) {
        element[k] = v;
      }
    }

    if (!element.type) {
      if (rawType !== "string")
        element.type = rawType;
      else {
        const enums = [Drivetrain, Motors, SwerveLevel, IntakeTypes];

        for (const enumType of enums) {
          if (Object.values(enumType).includes(value)) {
            element.type = enumType;
            break;
          }
        }

        if (!element.type)
          element.type = "string";
      }
    }

    if (!element.label) {
      element.label = camelCaseToTitleCase(element.key as string);
    }

    return element;
  }

  const components = Object.entries(props.layout).map(([key, value]) => {
    const inputs = value.map((key, index) => getComponent(key as string, index === value.length - 1));

    return (
      <div key={key}>
        <h1 className="font-semibold text-lg">{key}</h1>
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
      layout: game.pitReportLayout
     },
  };
};
