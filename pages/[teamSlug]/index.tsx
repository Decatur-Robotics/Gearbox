import UrlResolver, {
  ResolvedUrlData,
  SerializeDatabaseObject,
  SerializeDatabaseObjects,
} from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import { Competition, Season, Team, User } from "@/lib/Types";
import { MonthString } from "@/lib/client/FormatTime";
import { validName } from "@/lib/client/InputVerification";
import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Link from "next/link";

import { MdOutlineOpenInNew, MdOutlinePersonRemove } from "react-icons/md";
import { levelToClassName, xpRequiredForNextLevel, xpToLevel } from "@/lib/Xp";
import { Collections, GetDatabase } from "@/lib/MongoDB";
import { ObjectId } from "mongodb";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import { FaAngleDown, FaRobot, FaUserFriends } from "react-icons/fa";
import CompetitionCard from "@/components/CompetitionCard";
import SeasonCard from "@/components/SeasonCard";
import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";

const api = new ClientAPI("gearboxiscool");

type TeamPageProps = {
  team: Team | undefined;
  currentSeason: Season | undefined;
  currentCompetition: Competition | undefined;
  pastSeasons: Season[] | undefined;
  users: User[] | undefined;
};

function Overview(props: TeamPageProps) {
  return (
    <Card title="Overview" className="h-fit">
      <Flex mode="row" className=" min-h-[12rem] mb-8">
        <div className="w-1/2">
          <h1 className="font-semibold text-lg mb-2">Current Competition:</h1>
          <Link
            href={`/${props.team?.slug}/${props.currentSeason?.slug}/${props.currentCompetition?.slug}`}
          >
            <CompetitionCard comp={props.currentCompetition}></CompetitionCard>
          </Link>
        </div>
        <div className="divider divider-horizontal"></div>
        <div className="w-1/2">
          <h1 className="font-semibold text-lg mb-2">Current Season:</h1>
          {!props.currentSeason ? (
            <Link href={`/${props.team?.slug}/createSeason`}>
              <button className="btn btn-primary btn-wide">
                Create a Season
              </button>
            </Link>
          ) : (
            <Flex mode="col" className="space-y-4">
              <Link href={`/${props.team?.slug}/${props.currentSeason?.slug}`}>
                <SeasonCard season={props.currentSeason}></SeasonCard>
              </Link>
              <div>
                <h1 className="text-md font-semibold">Past Seasons:</h1>
                <ul className="list-disc ml-8">
                  {props.pastSeasons?.map((season) => (
                    <li key={season._id}>
                      <Link
                        href={`/${props.team?.slug}/${season.slug}`}
                        className="text-accent"
                      >
                        {season.name} - {season.year}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Flex>
          )}
        </div>
      </Flex>
    </Card>
  );
}

function Roster(props: TeamPageProps) {
  const team = props.team;
  const [users, setUsers] = useState(props.users ?? []);

  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requests, setRequests] = useState<User[]>([]);

  // add scouting stuff and accept requests

  useEffect(() => {
    const loadRequests = async () => {
      setLoadingRequests(true);
      var newData: User[] = [];
      for (const i in team?.requests) {
        newData.push(await api.findUserById(team?.requests[Number(i)]));
      }
      setRequests(newData);
      setLoadingRequests(false);
    };

    loadRequests();
  }, []);

  return (
    <Card title="Team Roster" className="h-full">
      <h1 className="text-lg font-semibold">View and Manage your Team</h1>
      <h1>
        <span className="text-accent">{users?.length}</span> total members
      </h1>

      <div className="w-full collapse collapse-arrow bg-base-300">
        <input type="checkbox" />
        <div className="collapse-title text-lg font-medium">
          Show Join Requests{" "}
          {requests.length > 0 ? (
            <div className="badge badge-primary ml-4">New</div>
          ) : (
            <></>
          )}
        </div>
        <div className="collapse-content">
          {loadingRequests ? (
            <Loading></Loading>
          ) : (
            <div className="w-full grid grid-cols-2 grid-rows-1">
              {requests.map((user) => (
                <Card className="" key={user._id}>
                  <Flex mode="row" className="space-x-2 items-center">
                    <img
                      src={user.image}
                      className="w-10 h-10 rounded-lg"
                    ></img>

                    <h1>{user.name}</h1>
                  </Flex>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="divider"></div>
      <table className="table">
        <thead>
          <tr>
            <th className="">Index</th>
            <th className="">Profile</th>
            <th className="">Name</th>
            <th className="">Scouter</th>
            <th className="">Manager</th>
            <th className="">Kick</th>
          </tr>
        </thead>
        <tbody className="">
          {users.map((user, index) => (
            <tr
              key={user._id}
              className="p-0 h-20 even:bg-base-100 odd:bg-base-200"
            >
              <th className="w-10">{index + 1}</th>
              <td className="absolute -translate-x-10 -translate-y-8">
                <Avatar user={user} scale="50"></Avatar>
              </td>
              <td className="font-semibold">{user.name}</td>
              <td>
                <input
                  type="checkbox"
                  className="toggle toggle-secondary"
                  checked
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  className="toggle toggle-secondary"
                  checked
                />
              </td>
              <td>
                <button className="btn btn-outline btn-error">
                  <MdOutlinePersonRemove size={20}></MdOutlinePersonRemove>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default function TeamIndex(props: TeamPageProps) {
  const { session, status } = useCurrentSession();
  const team = props.team;

  const isFrc = team?.tbaId?.startsWith("frc");

  return (
    <Container requireAuthentication={true} hideMenu={false}>
      <Flex mode={"col"} className="h-fit space-y-6 my-8 items-center">
        <Card title={team?.name} coloredTop={"secondary"}>
          <Flex mode="row" className="space-x-4">
            <h1 className="font-semibold text-lg">
              <FaRobot size={30} className="inline-block mr-2"></FaRobot>
              Team <span className="text-accent">{team?.number}</span>
            </h1>
            <div className="divider divider-horizontal"></div>
            <h1 className="font-semibold text-lg">
              <FaUserFriends
                className="inline-block mr-2"
                size={30}
              ></FaUserFriends>
              <span className="text-accent">{team?.users.length}</span> Active
              Members
            </h1>
          </Flex>

          <div className="divider"></div>
          <Flex mode="row" className="space-x-4">
            {isFrc ? (
              <div className="badge badge-secondary">FIRST FRC</div>
            ) : (
              <></>
            )}
            <Link
              href={"https://www.thebluealliance.com/team/4026"}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="badge badge-primary text-white underline">
                <MdOutlineOpenInNew />
                Linked to The Blue Alliance
              </div>
            </Link>
          </Flex>
        </Card>

        <Roster {...props}></Roster>
        <Overview {...props}></Overview>
      </Flex>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await GetDatabase();
  const resolved = await UrlResolver(context);

  const seasonIds = resolved.team?.seasons.map(
    (seasonId) => new ObjectId(seasonId)
  );
  const userIds = resolved.team?.users.map((userId) => new ObjectId(userId));
  const seasons = await db.findObjects<Season>(Collections.Seasons, {
    _id: { $in: seasonIds },
  });

  var users = await db.findObjects<User>(Collections.Users, {
    _id: { $in: userIds },
  });

  users = users.map((user) => {
    var c = structuredClone(user);
    c._id = user?._id?.toString();
    c.teams = user.teams.map((id) => String(id));
    return c;
  });

  const currentSeason = seasons[seasons.length - 1];
  var comp = undefined;
  if (currentSeason) {
    comp = await db.findObjectById<Competition>(
      Collections.Competitions,
      new ObjectId(
        currentSeason.competitions[currentSeason.competitions.length - 1]
      )
    );
  }

  return {
    props: {
      team: resolved.team,
      users: users,
      currentCompetition: SerializeDatabaseObject(comp),
      currentSeason: SerializeDatabaseObject(currentSeason),
      pastSeasons: SerializeDatabaseObjects(seasons),
    },
  };
};
