import ClientAPI from "@/lib/client/ClientAPI";
import { useEffect, useState } from "react";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { Competition, Form } from "@/lib/Types";
import { MonthString } from "@/lib/client/FormatTime";
import Container from "@/components/Container";
import Link from "next/link";
import { ClientSocket } from "@/lib/client/ClientSocket";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { Socket } from "socket.io-client";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
let io: Socket<DefaultEventsMap, DefaultEventsMap>;
const api = new ClientAPI("gearboxiscool");

export default function Home(props: ResolvedUrlData) {
  const { session, status } = useCurrentSession();
  const team = props.team;
  const owner = team?.owners.includes(session?.user?._id as string);

  const season = props.season;

  const [selection, setSelection] = useState(1);
  const [comps, setComps] = useState<Competition[]>([]);

  useEffect(() => {
    async function setUpSocket() {
      io = await ClientSocket();
      io.emit("update-checkin", "65be796074ea38a2d2d806c8");
      await api.updateCheckIn("65be796074ea38a2d2d806c8");
    }
    setUpSocket();

    window.addEventListener("beforeunload", () => {
      io.emit("update-checkout", "65be796074ea38a2d2d806c8");
    });

    window.addEventListener("onunload", () => {
      io.emit("update-checkout", "65be796074ea38a2d2d806c8");
    });

    const loadComps = async () => {
      var newComps: Competition[] = [];

      if (!season) {
        return;
      }

      for (const id of season?.competitions) {
        newComps.push(await api.findCompetitionById(id));
      }

      setComps(newComps);
    };

    loadComps();
  }, []);
  const Overview = () => {
    return (
      <div className="card w-5/6 bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Overview</h2>
          <h1 className="text-xl">See your upcoming competitions</h1>

          {owner ? (
            <h3>
              No Competitions?{" "}
              <a
                className="text-accent"
                href={`/${team?.slug}/${season?.slug}/createComp`}
              >
                Create a new one
              </a>
            </h3>
          ) : (
            <></>
          )}
          <div className="divider"></div>
          {comps.map((comp) => (
            <Link
              href={`/${team?.slug}/${season?.slug}/${comp.slug}`}
              key={comp._id}
            >
              <div className="card w-5/6 bg-base-300">
                <div className="card-body">
                  <h1 className="card-title">{comp.name}</h1>

                  <h1>
                    {MonthString(comp.start)} - {MonthString(comp.end)}
                  </h1>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Container requireAuthentication={true} hideMenu={false}>
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
        <div className="card w-5/6 bg-base-200 shadow-xl">
          <div className="card-body min-h-1/2 w-full bg-primary rounded-t-lg"></div>
          <div className="card-body">
            <h2 className="card-title text-4xl">{season?.name} </h2>
            <h1 className="text-2xl">
              The <span className="text-accent">{season?.year}</span> Season
            </h1>

            <div className="card-action space-x-2">
              {team?.tbaId ? (
                <a href={`https://www.thebluealliance.com/team/${team.number}`}>
                  <div className="badge badge-outline link">Linked To TBA</div>
                </a>
              ) : (
                <></>
              )}
              <div className="badge badge-secondary">FIRST FRC</div>
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-start w-5/6 ">
          <div className="w-3/8 join grid grid-cols-3">
            <button
              className={
                "join-item btn btn-outline normal-case " +
                (selection === 1 ? "btn-active" : "")
              }
              onClick={() => {
                setSelection(1);
              }}
            >
              Overview
            </button>
            <button
              className={
                "join-item btn btn-outline normal-case " +
                (selection === 3 ? "btn-active" : "")
              }
              onClick={() => {
                setSelection(3);
              }}
              disabled
            >
              Season-Wide Stats
            </button>
          </div>
        </div>

        {selection === 1 ? <Overview></Overview> : <></>}
        {selection === 3 ? <></> : <></>}
      </div>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  };
};
