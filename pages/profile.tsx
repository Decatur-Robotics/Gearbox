import { useCurrentSession } from "@/lib/client/hooks/useCurrentSession";
import { useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import { League, Team } from "@/lib/Types";
import Container from "@/components/Container";
import Link from "next/link";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import Avatar from "@/components/Avatar";
import { IoCheckmarkCircle, IoCloseCircle, IoMail } from "react-icons/io5";
import Loading from "@/components/Loading";
import { FaPlus } from "react-icons/fa";
import { getDatabase } from "@/lib/MongoDB";
import Collections from "@/lib/client/CollectionId";
import { GetServerSideProps } from "next";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";
import TeamCard from "@/components/TeamCard";
import { UpdateModal } from "@/components/UpdateModal";
import { Analytics } from "@/lib/client/Analytics";
import { ObjectId } from "bson";
import useDocumentArrayFromDb from "@/lib/client/hooks/useDocumentArrayFromDb";
import { useDbWriter } from "@/lib/client/DualDbWriter";
import { signOut } from "next-auth/react";

const api = new ClientAPI("gearboxiscool");

export default function Profile(props: { teamList: Team[] }) {
  const dbWriter = useDbWriter();
  const { session } = useCurrentSession();
  const user = session?.user;

  const owner = user?.owner ? user?.owner?.length > 0 : false;
  const member = user?.teams ? user.teams?.length > 0 : false;

  const [searchedTeamNumber, setSearchedTeamNumber] = useState<number>();
  const searchedTeams = useDocumentArrayFromDb<Team>({
    collection: Collections.Teams,
    query: { number: searchedTeamNumber },
    dontLoadIf: () => !searchedTeamNumber,
  });

  const teams = useDocumentArrayFromDb<Team>({
    collection: Collections.Teams,
    query: { _id: { $in: user?.teams?.map?.((id) => new ObjectId(id)) ?? [] } },
    dontLoadIf: () => !user?.teams,
  });

  const [loadingRequest, setLoadingRequest] = useState(false);
  const [teamsRequestedToJoin, setTeamsRequestedToJoin] = useState<{ [teamId: string]: boolean }>({});

  const requestTeam = async (teamId: string, teamNumber: number) => {
    if (!user) {
      console.error("User not found");
      return;
    }

    setLoadingRequest(true);

    dbWriter?.updateObjectById(Collections.Teams, new ObjectId(teamId), {
      $push: { requests: user._id },
    })
      .then(() => {
        setTeamsRequestedToJoin({
          ...teamsRequestedToJoin,
          [teamId]: true
        });
      })
      .catch((err) => {
        console.error("Failed to request to join team:", err);
        setTeamsRequestedToJoin({
          ...teamsRequestedToJoin,
          [teamId]: false
        });
        })
      .finally(() => setLoadingRequest(false));

    Analytics.requestedToJoinTeam(teamNumber, user?.name ?? "Unknown User");
  };

  return (
    <Container requireAuthentication={true} hideMenu={false} title="Profile">
      <UpdateModal />
      <Flex className="my-8 space-y-4" center={true} mode="col">
        <Card title={user?.name} coloredTop="bg-accent">
          <Flex
            mode="row"
            className="space-x-4 max-sm:flex-col max-sm:items-center"
          >
            <div className="flex flex-col">
              <Avatar />
              <button className="btn btn-secondary mt-3" onClick={() => signOut()}>Sign Out</button>
            </div>
            <div className="">
              <h1 className="italic text-lg max-sm:text-sm">
                Known as: {user?.slug}
              </h1>
              <h1 className="text-lg max-sm:text-sm">
                <IoMail className="inline text-lg max-sm:text-md" />{" "}
                {user?.email}
              </h1>
              <Flex mode="row" className="mt-4 space-x-2">
                {member &&
                  <div className="badge badge-md md:badge-lg badge-neutral">
                    Member
                  </div>
                }

                {owner &&
                  <div className="badge badge-md md:badge-lg badge-primary">
                    Team Owner
                  </div>
                }
              </Flex>
            </div>
          </Flex>
        </Card>

        <Card title="Your Teams">
          <div className="flex flex-row flex-wrap space-y-3">
            {teams.value?.map?.((team) => (
              <Link key={team._id?.toString()} href={`/${team.slug}`} className="w-full">
                <TeamCard team={team} />
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Join a team">
          <p>Find your team:</p>
          <div className="w-full h-full">
            <input type="number" placeholder="Enter your team number" className="w-full input input-bordered" 
              onChange={(e) => setSearchedTeamNumber(e.target.value.length > 0 ? Math.max(+e.target.value, 1) : undefined)}
              value={searchedTeamNumber} />
            { !searchedTeamNumber 
                ? <></>
                : (
                    <>
                      <div className="flex flex-row pt-4 space-x-4">
                        {Object.keys(League)
                          .map((league) => searchedTeams.value?.find((team) => team.league === league 
                            || (league == League.FRC && !team.league)) ?? league)
                          .map((team) => typeof team === "string" ? (
                            <Card key={team} title={`${team} ${searchedTeamNumber} not found`} 
                                className="w-1/2 bg-base-300 border-4 border-base-300 transition ease-in hover:border-primary">
                              <div className="h-full flex flex-col">
                                {/** The empty flex-grow div pushes the link to the bottom of the flexbox */}
                                <div className="flex-grow" />
                                <Link href={`/createTeam?number=${searchedTeamNumber}&league=${team}`} className="btn btn-primary">Create Team</Link>
                              </div>
                            </Card>
                          )
                          : (
                            <Card key={team._id?.toString()} title={team.name} className="w-1/2 bg-base-300 border-4 border-base-300 transition ease-in hover:border-primary">
                              <h1 className="font-semibold max-sm:text-sm">
                                {team.league} Team <span className="text-accent">{team.number}</span> -{" "}
                                <span className="text-primary">{team.users.length}</span> members
                              </h1>
                              <div className="flex flex-col">
                                {/** The empty flex-grow div pushes the button to the bottom of the flexbox */}
                                <div className="flex-grow" />
                                <button className="btn btn-primary" onClick={() => requestTeam(team._id.toString(), team.number)}>
                                  {loadingRequest 
                                    ? <Loading /> 
                                    : Object.keys(teamsRequestedToJoin).includes(team._id.toString())
                                      ? teamsRequestedToJoin[team._id.toString()]
                                        ? <div className="flex flex-row align-middle space-x-1">
                                            <IoCheckmarkCircle />
                                            <p>Requested!</p>
                                          </div>
                                        : <div className="flex flex-row align-middle space-x-1">
                                            <IoCloseCircle />
                                            <p>Failed to Request</p>
                                          </div>
                                      : "Request to Join"}
                                </button>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </>
                  )
              }
          </div>
        </Card>
      </Flex>
    </Container>
  );
}