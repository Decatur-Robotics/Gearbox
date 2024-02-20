import { Season } from "../../lib/Types";
import ClientAPI from "../../lib/client/ClientAPI";
import { useEffect, useState } from "react";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import Container from "@/components/Container";

const api = new ClientAPI("gearboxiscool");

export const CurrentSeason = new Season("Crescendo", undefined, 2024);
export const OffSeason = new Season("Off Season", undefined, 2024);

export default function Home(props: ResolvedUrlData) {
  const team = props.team;

  const [year, setYear] = useState(CurrentSeason.year);
  const [name, setName] = useState(CurrentSeason.name);
  const [existingSeasons, setExistingSeasons] = useState<string[] | undefined>(
    [],
  );

  const createSeason = async (season: { name: string; year: number }) => {
    const s = await api.createSeason(
      season.name,
      season.year,
      team?._id as string,
    );
    const win: Window = window;
    win.location = `/${team?.slug}/${s.slug}`;
  };

  useEffect(() => {
    async function findSeasons() {
      var newData = [];
      if (!team?.seasons) {
        return;
      }
      for (var id of team?.seasons) {
        newData.push((await api.findSeasonById(id)).name);
      }
      setExistingSeasons(newData);
    }

    findSeasons();
  }, []);

  return (
    <Container requireAuthentication={true} hideMenu={false}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="card w-5/6 bg-base-200 shadow-xl">
          <div className="card-body flex flex-col items-center">
            <h2 className="card-title text-3xl mb-10">Create a new Season</h2>

            <div className="flex flex-col lg:flex-row space-y-10 lg:space-x-10 lg:justify-center items-center">
              <div className="card lg:w-1/4 bg-base-100 shadow-xl">
                <figure>
                  <img
                    src={
                      "https://www.firstinspires.org/sites/default/files/uploads/resource_library/frc/crescendo/crescendo.png"
                    }
                    alt="Season Logo"
                  />
                </figure>
                <div className="card-body">
                  <h2 className="card-title text-2xl">{CurrentSeason.name}</h2>
                  <p className="text-xl">
                    FIRST Robotics{" "}
                    <span className="text-accent">
                      {CurrentSeason.year} Season
                    </span>
                  </p>
                  <div className="card-actions justify-end">
                    <button
                      className={`btn ${existingSeasons?.includes(CurrentSeason.name) ? "btn-disabled disabled" : "btn-primary"} normal-case`}
                      onClick={() => {
                        createSeason(CurrentSeason);
                      }}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>

              <div className="card lg:w-1/4 bg-base-100 shadow-xl">
                <figure>
                  <img
                    src={
                      "https://www.firstinspires.org/sites/default/files/open-graph-first-logo.png"
                    }
                    alt="Season Logo"
                  />
                </figure>
                <div className="card-body">
                  <h2 className="card-title text-2xl">{OffSeason.name}</h2>
                  <p className="text-xl">
                    FIRST Robotics{" "}
                    <span className="text-accent">{OffSeason.year} Season</span>
                  </p>
                  <div className="card-actions justify-end">
                    <button
                      className={`btn ${existingSeasons?.includes(OffSeason.name) ? "btn-disabled disabled" : "btn-primary"} normal-case`}
                      onClick={() => {
                        createSeason(OffSeason);
                      }}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  };
};
