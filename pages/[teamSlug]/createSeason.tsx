import { Season, Team } from "../../lib/Types";
import ClientAPI from "../../lib/client/ClientAPI";
import { useEffect, useState } from "react";
import UrlResolver, {
  ResolvedUrlData,
  SerializeDatabaseObjects,
} from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import Container from "@/components/Container";
import { Collections, GetDatabase } from "@/lib/MongoDB";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import Image from "next/image";
import { FaPlus } from "react-icons/fa";
import { create } from "domain";

const api = new ClientAPI("gearboxiscool");
const CurrentSeason = new Season("Crescendo", undefined, 2024);
const OffSeason = new Season("Offseason", undefined, 2024);

type CreateSeasonProps = { team: Team; existingSeasons: Season[] };

export default function CreateSeason(props: CreateSeasonProps) {
  const team = props.team;
  const [existingSeasons, setExistingSeasons] = useState<string[]>(
    props.existingSeasons.map((season) => season.name)
  );

  const createSeason = async (season: { name: string; year: number }) => {
    const s = await api.createSeason(
      season.name,
      season.year,
      team?._id as string
    );
    const win: Window = window;
    win.location = `/${team?.slug}/${s.slug}`;
  };

  return (
    <Container requireAuthentication={true} hideMenu={false}>
      <Flex mode="row" center={true} className="h-fit py-24">
        <div className="w-2/3 flex flex-row space-x-4">
          <Card title={CurrentSeason.name} className="w-1/3 bg-base-300">
            <h1 className="text-lg font-semibold">
              Made for the{" "}
              <span className="text-accent">{CurrentSeason.year}</span> season
            </h1>
            <img
              className="w-fit h-auto"
              src={
                "https://www.firstinspires.org/sites/default/files/uploads/resource_library/frc/crescendo/crescendo.png"
              }
            ></img>
            <button
              className="btn btn-primary"
              onClick={() => {
                createSeason(CurrentSeason);
              }}
            >
              <FaPlus></FaPlus>Create
            </button>
          </Card>
          <Card title={OffSeason.name} className="w-1/3 bg-base-300">
            <h1 className="text-lg font-semibold">
              Perfect for testing and off-season events
            </h1>
            <img
              className="w-fit h-auto bg-white rounded-lg"
              src={"/Offseason.png"}
            ></img>
            <button
              className="btn btn-primary"
              onClick={() => {
                createSeason(OffSeason);
              }}
            >
              <FaPlus></FaPlus>Create
            </button>
          </Card>
        </div>
      </Flex>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await GetDatabase();
  const resolved = await UrlResolver(context);
  const existingSeasons = await db.findObjects(Collections.Seasons, {
    _id: { $in: resolved.team?.seasons },
  });
  return {
    props: {
      team: resolved.team,
      existingSeasons: SerializeDatabaseObjects(existingSeasons),
    },
  };
};
