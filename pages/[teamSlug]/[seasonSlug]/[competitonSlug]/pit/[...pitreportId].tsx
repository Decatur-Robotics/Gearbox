import { Collections, GetDatabase } from "@/lib/MongoDB";
import { Motors, Pitreport, SwerveLevel } from "@/lib/Types";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";

import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useCallback, useState } from "react";
import Checkbox, {
  DrivetrainType,
  IntakeType,
} from "@/components/forms/Checkboxes";
import { CommentBox } from "@/components/forms/Comment";
import ClientAPI from "@/lib/client/ClientAPI";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import { FaRobot } from "react-icons/fa";

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
    });
    location.href = location.href.substring(
      0,
      location.href.lastIndexOf("/pit")
    );
  }

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
          <h1 className="text-2xl font-semibold">Physical Attributes:</h1>
          <div className="divider"></div>

          <h1 className="font-semibold text-lg">Intake: </h1>
          <div className="translate-x-10">
            <IntakeType data={pitreport} callback={setCallback}></IntakeType>
            <Checkbox
              label="Under Bumper Intake"
              dataKey="underBumperIntake"
              data={pitreport}
              callback={setCallback}
            ></Checkbox>
          </div>
          <h1 className="font-semibold text-lg mt-8">Drivetrain: </h1>
          <div className="translate-x-10">
            <DrivetrainType
              data={pitreport}
              callback={setCallback}
            ></DrivetrainType>
            <h1 className="font-mono mt-4">Drive Motor Type:</h1>
            <select
              className=" w-1/3 select select-bordered"
              value={pitreport.motorType}
              onChange={(e) => setCallback("motorType", e.target.value)}
            >
              {Object.values(Motors).map((val) => (
                <option value={val} key={val}>
                  {val}
                </option>
              ))}
            </select>
            <h1 className="font-mono mt-4">Swerve Level:</h1>
            <select
              className=" w-1/3 select select-bordered"
              value={pitreport.swerveLevel}
              onChange={(e) => setCallback("swerveLevel", e.target.value)}
            >
              {Object.values(SwerveLevel).map((val) => (
                <option value={val} key={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>
          <h1 className="font-semibold text-lg mt-8">Shooter: </h1>
          <div className="translate-x-10">
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
            <Checkbox
              label="Fixed Angle Shooter"
              dataKey="fixedShooter"
              data={pitreport}
              callback={setCallback}
            ></Checkbox>
            <Checkbox
              label="Can Score From Distance"
              dataKey="fixedShooter"
              data={pitreport}
              callback={setCallback}
            ></Checkbox>
          </div>
          <h1 className="font-semibold text-lg mt-8">Climber: </h1>
          <div className="translate-x-10">
            <Checkbox
              label="Can Climb"
              dataKey="canClimb"
              data={pitreport}
              callback={setCallback}
            ></Checkbox>
          </div>
          <h1 className="font-semibold text-lg mt-8">Auto: </h1>
          <div className="translate-x-10">
            <h1 className="font-mono mt-4">Ideal Auto Notes:</h1>
            <input
              value={pitreport.autoNotes}
              onChange={(e) => {
                setCallback("autoNotes", e.target.value);
              }}
              type="number"
              className="input input-bordered"
              placeholder="Auto Notes"
            ></input>
          </div>
          <div className="w-full text-lg flex flex-col items-center justify-center">
            <CommentBox data={pitreport} callback={setCallback}></CommentBox>
          </div>
          <button className="btn btn-primary " onClick={submit}>
            Submit
          </button>
        </Card>
      </Flex>
    </Container>
  );
}

async function getPitreport(id: string) {
  const db = await GetDatabase();
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
