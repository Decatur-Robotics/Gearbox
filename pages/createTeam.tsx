import { League, Team } from "@/lib/Types";
import { useEffect, useState } from "react";

import { useCurrentSession } from "@/lib/client/useCurrentSession";

import ClientAPI from "@/lib/client/ClientAPI";
import Container from "@/components/Container";
import Card from "@/components/Card";
import Flex from "@/components/Flex";
import Loading from "@/components/Loading";
import TeamCard from "@/components/TeamCard";
import { TheOrangeAlliance } from "@/lib/TheOrangeAlliance";
import { Analytics } from "@/lib/client/Analytics";

const api = new ClientAPI("gearboxiscool");

export default function CreateTeam() {
  const { session, status } = useCurrentSession();

  const [teamNumber, setTeamNumber] = useState<string>();
  const [autoData, setAutoData] = useState<Team>();
  const [ftcAutoData, setFtcAutoData] = useState<Team>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allianceNumber,setAllianceNumber] = useState<number>();
  const [allianceName, setAllianceName] = useState<string>();
  const [creatingTeam, setCreatingTeam] = useState<boolean>();
  const [settingState, setSettingState] = useState<boolean>(true)


  const searchTeam = async () => {
    if (!teamNumber) {
      return;
    }

    setLoading(true);

    setAutoData(undefined);
    setFtcAutoData(undefined);

    api.getTeamAutofillData(Number(teamNumber)).then((data) => {
      if (data?.name) {
        setAutoData(data);
      }
    });

    api.getFtcTeamAutofillData(Number(teamNumber)).then((data) => {
      console.log(data);
      if (data?.name) {
        setFtcAutoData(data);
      }
    });

    setLoading(false);
  };

  const createTeam = async (league: League) => {
    setError("")
    if (!autoData || !session?.user) {
      return;
    }

    if (
      await api.findTeamByNumberAndLeague(Number(teamNumber), league)
    ) {
      setError("This Team Already Exists");
      return;
    }

    const data = league === League.FRC ? autoData : ftcAutoData;

    if (!data) {
      setError("No Team Found");
      return;
    }
    
    const newTeam = await api.createTeam(
      data.name,
      data.number,
      session.user._id,
      data.tbaId,
      league
    );

    Analytics.teamCreated(data.number, data.league, session?.user?.name ?? "Unknown User");

    const win: Window = window;
    win.location = `/${newTeam.slug}`;
  };

  async function createAlliance(league: League){
    setError("")
    console.log("Beginning Alliance Creation")
    if (!session?.user) {
      return;
    }


    if (
      await api.findTeamByNumberAndLeague(Number(allianceNumber), league)
    ) {
      console.log(allianceNumber)
      console.log(league)
      setError("This Team Already Exists");
      return;
    }

    if (allianceNumber?.toString().length!=7){
      setError("Alliances must have a seven digit number")
      return
    }

    if(!allianceName) {
      setError("Your alliance must have a name")
      return
    }
    console.log("Made part 2")

    
    const newTeam = await api.createTeam(
      allianceName,
      allianceNumber!,
      session.user._id,
      "none",
      league
    );
    console.log("Created")
    const win: Window = window;
    win.location = `/${newTeam.slug}`;
  }

  useEffect(() => {
    searchTeam();
  }, [teamNumber]);

  ///*** query and prevent dups! */

  return (
    <Container requireAuthentication={true} hideMenu={false} title="Create Team">
      <Flex
        mode="col"
        className="md:h-full items-center md:justify-center max-sm:py-10"
      >
        {settingState ?  
        <Card title="Create an Organization" className="">
          <div className="divider"></div>
        <div className="btn btn-primary" onClick={()=>{
          setSettingState(false)
          setCreatingTeam(false)
          }}>Create an Alliance</div>
        <div></div>
        <div className="btn btn-primary" onClick={()=>{
          setSettingState(false)
          setCreatingTeam(true)
        }}>Create a team</div>
        </Card>
        :
        
        creatingTeam? <Card title="Create a Team" className="">
          <h1 className="font-semibold text-accent md:ml-4">
            Search our database with your teams number
          </h1>
          <h1 className="text-error">{error}</h1>
          <div className="btn btn-primary" onClick={()=>setSettingState(true)}>Go Back</div>
          <div className="divider"></div>
          <input
            className="input input-bordered md:w-1/2"
            placeholder="Team Number"
            maxLength={5}
            minLength={1}
            value={teamNumber}
            onChange={(e) => {
              setTeamNumber(e.target.value);
            }}
          ></input>
          {teamNumber && (
            <div className="md:w-1/2 h-48 mt-10">
              {loading ? (
                <Loading />
              ) : (
                <div className="flex flex-row space-x-2">
                  { autoData?.name &&
                    <div onClick={() => createTeam(League.FRC)}>
                      <TeamCard team={autoData} />
                    </div>
                    
                  }
                  { ftcAutoData?.name &&
                    <div onClick={() => createTeam(League.FTC)}>
                      <TeamCard team={ftcAutoData} />
                    </div>
                  }
                </div>
              )}
            </div>
          )}
        </Card> 

        : 

        <Card title="Create an Alliance" className="">
          <h1 className="font-semibold text-accent md:ml-4">
            Create your Scouting Alliance
          </h1>
          <h1 className="text-error">{error}</h1>
          <div className="btn btn-primary" onClick={()=>setSettingState(true)}>Go Back</div>
          <div className="divider"></div>
          <input
            className="input input-bordered md:w-1/2"
            placeholder="Alliance ID (7 characters)"
            maxLength={7}
            minLength={7}
            value={allianceNumber}
            onChange={(e) => {
              setAllianceNumber(Number(e.target.value));
            }}
          ></input>
          <input
            className="input input-bordered md:w-1/2"
            placeholder="Alliance Name"
            value={allianceName}
            onChange={(e) => {
              setAllianceName(e.target.value);
            }}
          ></input>
          <div></div>
          <div className="btn btn-secondary" onClick={() => createAlliance(League.FRC)}>Create Alliance</div>
        </Card>}
      </Flex>
    </Container>
  );
}
