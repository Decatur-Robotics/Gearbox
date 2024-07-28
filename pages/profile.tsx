import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import { Team } from "@/lib/Types";
import Container from "@/components/Container";
import Link from "next/link";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import Avatar from "@/components/Avatar";
import { IoCheckmarkCircle, IoMail } from "react-icons/io5";
import Loading from "@/components/Loading";
import { FaPlus } from "react-icons/fa";
import { Collections, getDatabase } from "@/lib/MongoDB";
import { GetServerSideProps } from "next";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";
import TeamCard from "@/components/TeamCard";
import { UpdateModal } from "@/components/UpdateModal";

const api = new ClientAPI("gearboxiscool");

export default function Profile(props: { teamList: Team[] }) {
  const { session, status } = useCurrentSession();
  const user = session?.user;
  const teamList = props.teamList;

  const owner = user?.owner ? user?.owner?.length > 0 : false;
  const member = user?.teams ? user.teams?.length > 0 : false;

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [sentRequest, setSentRequest] = useState(false);

  const [addTeam, setAddTeam] = useState(false);

  useEffect(() => {
    const loadTeams = async () => {
      setLoadingTeams(true);
      var newTeams: Team[] = [];
      for (const id in user?.teams) {
        newTeams.push(await api.findTeamById(user?.teams[Number(id)]));
      }
      setTeams(newTeams);
      setLoadingTeams(false);
    };

    if (user?.teams) {
      loadTeams();
    }
  }, [session?.user]);

  const requestTeam = async (teamId: string) => {
    setLoadingRequest(true);
    await api.requestToJoinTeam(user?._id, teamId);
    setLoadingRequest(false);
    setSentRequest(true);
  };

  return (
    <Container requireAuthentication={true} hideMenu={false}>
      <UpdateModal />
      <Flex className="my-8 space-y-4" center={true} mode="col">
        <Card title={user?.name} coloredTop="bg-accent">
          <Flex
            mode="row"
            className="space-x-4 max-sm:flex-col max-sm:items-center"
          >
            <Avatar></Avatar>
            <div className="">
              <h1 className="italic text-lg max-sm:text-sm">
                Known as: {user?.slug}
              </h1>
              <h1 className="text-lg max-sm:text-sm">
                <IoMail className="inline text-lg max-sm:text-md" />{" "}
                {user?.email}
              </h1>
              <Flex mode="row" className="mt-4 space-x-2">
                {member ? (
                  <div className="badge badge-md md:badge-lg badge-neutral">
                    Member
                  </div>
                ) : (
                  <></>
                )}

                {owner ? (
                  <div className="badge badge-md md:badge-lg badge-primary">
                    Team Owner
                  </div>
                ) : (
                  <></>
                )}
              </Flex>
            </div>
          </Flex>
        </Card>

        <Card title="Your Teams">
          <p>Select your current team:</p>
          <div className="divider mt-2" />
          <div className="w-full h-full">
            {loadingTeams ? (
              <Loading></Loading>
            ) : (
              <Flex mode="col" center={true} className="space-y-2">
                {teams.map((team) => (
                  <Link
                    href={"/" + team.slug}
                    className="w-full"
                    key={team._id}
                  >
                    <TeamCard team={team} />
                  </Link>
                ))}
              </Flex>
            )}

            <Flex center={true} className="mt-8">
              {!addTeam ? (
                <button
                  className="btn btn-circle bg-primary"
                  onClick={() => {
                    setAddTeam(true);
                  }}
                >
                  <FaPlus className="text-white"></FaPlus>
                </button>
              ) : (
                <Card title="Add Team" className="bg-base-300 w-full">
                  <div className="divider"></div>
                  <Flex mode="row" className="max-sm:flex-col">
                    <div className="w-1/2 max-sm:w-full">
                      <h1 className="font-semibold text-xl">Join a Team</h1>
                      <p className="mb-2">Select your Team</p>
                      <div className="w-full h-48 max-sm:h-fit py-2 bg-base-100 rounded-xl md:overflow-y-scroll max-sm:overflow-x-scroll flex flex-col max-sm:flex-row items-center">
                        {sentRequest ? (
                          <div className="alert alert-success w-full h-full text-white flex flex-col text-xl justify-center">
                            <IoCheckmarkCircle size={48}></IoCheckmarkCircle>
                            Team Request Sent
                          </div>
                        ) : loadingRequest ? (
                          <Loading></Loading>
                        ) : (
                          teamList.map((team) => (
                            <div
                              className="bg-base-300 w-11/12 rounded-xl p-4 mt-2 border-2 border-base-300 transition ease-in hover:border-primary"
                              onClick={() => {
                                requestTeam(String(team._id));
                              }}
                              key={team._id}
                            >
                              <h1 className="max-sm:text-sm h-10">
                                {team.tbaId ? "FRC" : "FTC"}{" "}
                                <span className="text-primary">
                                  {team.number}
                                </span>
                              </h1>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="divider md:divider-horizontal max-sm:divider-vertical"></div>
                    <Flex mode="col" className="w-1/2 items-center space-y-4">
                      <img src="/art/4026.svg" className="w-1/2 h-auto"></img>
                      <Link
                        href={"/createTeam"}
                        className="btn btn-primary md:btn-wide text-white"
                      >
                        Create a Team
                      </Link>
                    </Flex>
                  </Flex>
                </Card>
              )}
            </Flex>
          </div>
        </Card>
      </Flex>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await getDatabase();
  const teams = await db.findObjects(Collections.Teams, {});
  const serializedTeams = teams.map((team) => SerializeDatabaseObject(team));

  return {
    props: { teamList: serializedTeams },
  };
};
