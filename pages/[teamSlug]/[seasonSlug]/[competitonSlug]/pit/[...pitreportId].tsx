import { Collections, GetDatabase } from "@/lib/MongoDB";
import { Pitreport } from "@/lib/Types";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";

import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useCallback, useState } from "react";
import ImageUpload from "@/components/forms/ImageUpload";
import Checkbox, {
  DrivetrainType,
  IntakeType,
} from "@/components/forms/Checkboxes";
import { CommentBox } from "@/components/forms/Comment";
import ClientAPI from "@/lib/client/ClientAPI";

const gdb = GetDatabase();
const api = new ClientAPI("gearboxiscool");

export default function PitreportForm(props: { pitreport: Pitreport }) {
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  const [pitreport, setPitreport] = useState(props.pitreport);

  const setCallback = useCallback(
    (key: any, value: boolean | string | number) => {
      setPitreport((old) => {
        let copy = structuredClone(old);
        //@ts-expect-error
        copy[key] = value;
        return copy;
      });
    },
    []
  );

  async function submit() {
    await api.updatePitreport(props.pitreport?._id, {
      image: pitreport.image,
      intakeType: pitreport.intakeType,
      canClimb: pitreport.canClimb,
      drivetrain: pitreport.drivetrain,
      canScoreAmp: pitreport.canScoreAmp,
      canScoreSpeaker: pitreport.canScoreSpeaker,
      comments: pitreport.comments,
      submitted: true,
    });
    location.href = location.href.substring(
      0,
      location.href.lastIndexOf("/pit")
    );
  }

  return (
    <Container requireAuthentication={false} hideMenu={!hide}>
      <div className="w-screen flex flex-col items-center justify-center space-y-4">
        <div className="card w-11/12 md:w-2/3 bg-base-200 mt-2">
          <div className="card-body">
            <div className="text-center">
              <p className="text-xl font-mono">Currently Pit-scouting</p>
              <h1 className="text-5xl font-bold">{pitreport.teamNumber}</h1>
            </div>
          </div>
        </div>

        <div className="card w-11/12 md:w-2/3 bg-base-200 mb-2">
          <div className="card-body w-full flex flex-col justify-center items-center text-center">
            <h1>Physical Attributes: </h1>

            <div className="translate-x-2">
              <h1 className="font-semibold text-lg">Intake Style: </h1>
              <IntakeType data={pitreport} callback={setCallback}></IntakeType>
              <h1 className="font-semibold text-lg mt-8">Drivetrain Style: </h1>
              <DrivetrainType
                data={pitreport}
                callback={setCallback}
              ></DrivetrainType>
            </div>

            <Checkbox
              label="Can Climb"
              dataKey="canClimb"
              data={pitreport}
              callback={setCallback}
            ></Checkbox>
            <Checkbox
              label="Can Score Amp"
              dataKey="canScoreAmp"
              data={pitreport}
              callback={setCallback}
            ></Checkbox>
            <Checkbox
              label="Can Score Speaker"
              dataKey="canScoreSpeaker"
              data={pitreport}
              callback={setCallback}
            ></Checkbox>

            <div className="w-11/12 md:w-1/2">
              <CommentBox data={pitreport} callback={setCallback}></CommentBox>
            </div>

            <button className="btn btn-wide btn-primary " onClick={submit}>
              Submit
            </button>
          </div>
        </div>
      </div>
    </Container>
  );
}

async function getPitreport(id: string) {
  const db = await gdb;
  return await db.findObjectById<Pitreport>(
    Collections.Pitreports,
    new ObjectId(id)
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.resolvedUrl.split("/pit/")[1];
  const pitreport = await getPitreport(id);
  return {
    props: { pitreport: SerializeDatabaseObject(pitreport) },
  };
};
