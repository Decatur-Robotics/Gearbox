import { Team } from "@/lib/Types";
import { useEffect, useState } from "react";

import { useCurrentSession } from "@/lib/client/useCurrentSession";

import ClientAPI from "@/lib/client/ClientAPI";
import Container from "@/components/Container";
import Card from "@/components/Card";
import Flex from "@/components/Flex";
import Loading from "@/components/Loading";
import TeamCard from "@/components/TeamCard";

const api = new ClientAPI("gearboxiscool");

export default function CreateTeam() {
  const { session, status } = useCurrentSession();

  const [teamNumber, setTeamNumber] = useState<string>();
  const [autoData, setAutoData] = useState<Team>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchTeam = async () => {
    if (!teamNumber) {
      return;
    }

    setLoading(true);
    setAutoData(undefined);
    let data = await api.getTeamAutofillData(Number(teamNumber));
    if (data?.name) {
      setAutoData(data);
    }
    setLoading(false);
  };

  const createTeam = async () => {
    if (!autoData || !session?.user) {
      return;
    }

    if (
      Object.keys(await api.findTeamByNumber(Number(teamNumber))).length > 0
    ) {
      setError("This Team Already Exists");
      return;
    }

    let newTeam = await api.createTeam(
      autoData.name,
      autoData.number,
      session.user._id,
      autoData.tbaId
    );

    const win: Window = window;
    win.location = `/${newTeam.slug}`;
  };

  useEffect(() => {
    searchTeam();
  }, [teamNumber]);

  ///*** query and prevent dups! */

  return (
    <Container requireAuthentication={true} hideMenu={false}>
      <Flex
        mode="col"
        className="md:h-full items-center md:justify-center max-sm:py-10"
      >
        <Card title="Create a Team" className="">
          <h1 className="font-semibold text-accent md:ml-4">
            Search our database with your teams number
          </h1>
          <h1 className="text-error">{error}</h1>
          <div className="divider"></div>
          <input
            className="input input-bordered md:w-1/2"
            placeholder="Team Number"
            maxLength={4}
            minLength={1}
            value={teamNumber}
            onChange={(e) => {
              setTeamNumber(e.target.value);
            }}
          ></input>
          {teamNumber ? (
            <div className="md:w-1/2 h-48 mt-10">
              {loading ? (
                <Loading></Loading>
              ) : (
                <div onClick={createTeam}>
                  <TeamCard team={autoData}></TeamCard>
                </div>
              )}
            </div>
          ) : (
            <></>
          )}
        </Card>
      </Flex>
    </Container>
  );
}
