import { useCurrentSession } from "@/lib/client/hooks/useCurrentSession";
import { useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import { League, Team } from "@/lib/Types";
import Container from "@/components/Container";
import Link from "next/link";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import Avatar from "@/components/Avatar";
import { IoCheckmarkCircle, IoMail } from "react-icons/io5";
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

const api = new ClientAPI("gearboxiscool");

export default function Profile(props: { teamList: Team[] }) {
  const dbWriter = useDbWriter();
  const { session, status } = useCurrentSession();
  const user = session?.user;
  const teamList = props.teamList;

  const owner = user?.owner ? user?.owner?.length > 0 : false;
  const member = user?.teams ? user.teams?.length > 0 : false;

  const [searchedTeamNumber, setSearchedTeamNumber] = useState<number>();
  const searchedTeams = useDocumentArrayFromDb<Team>({
    collection: Collections.Teams,
    query: { number: searchedTeamNumber },
    dontLoadIf: () => !searchedTeamNumber,
  });

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

  const requestTeam = async (teamId: string, teamNumber: number) => {
    if (!user) {
      console.error("User not found");
      return;
    }

    setLoadingRequest(true);
    // await api.requestToJoinTeam(user._id, new ObjectId(teamId));

    dbWriter?.updateObjectById(Collections.Teams, new ObjectId(teamId), {
      $push: { requests: user._id },
    });

    setLoadingRequest(false);
    setSentRequest(true);

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
            <Avatar />
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
          <p>Find your team:</p>
          <div className="w-full h-full">
            <input type="number" placeholder="Enter your team number" className="w-full input input-bordered" 
              onChange={(e) => setSearchedTeamNumber(+e.target.value)} />
            { !searchedTeamNumber 
                ? <></>
                : (
                    <>
                      <div className="flex flex-row pt-4 space-x-4">
                        {Object.keys(League).map((league) => 
                          teamList.find((team) => team.league === league) ? (
                            <TeamCard
                              key={league}
                              team={teamList.find((team) => team.league === league)}
                            />
                          ) : (
                            <Card key={league} title={`${league} ${searchedTeamNumber} not found`}>
                              <p>Team not found</p>
                              <Link href="/createTeam" className="btn btn-primary">Create Team</Link>
                            </Card>
                          )
                        )}
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await getDatabase();
  const teams = await db.findObjects(Collections.Teams, {});
  const serializedTeams = teams.map((team) => SerializeDatabaseObject(team));

  return {
    props: { teamList: serializedTeams },
  };
};
