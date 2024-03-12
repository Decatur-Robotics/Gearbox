import { TheBlueAlliance } from "@/lib/TheBlueAlliance";
import { GetServerSideProps } from "next";
import { Competition } from "@/lib/Types";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Container from "@/components/Container";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";
import { DateString, TimeString } from "@/lib/client/FormatTime";


const tba =  new TheBlueAlliance.Interface();

export default function PublicEvent(props: {comp: Competition, firstRanking: TheBlueAlliance.SimpleRank[] , oprRanking: TheBlueAlliance.OprRanking}) {
    const { session, status } = useCurrentSession();
    const hide = status === "authenticated";

    

    const oprs = props.oprRanking.oprs;
    //@ts-ignore
    const first = props.firstRanking.rankings;
    
  
    return (
      <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
            <div className="card w-5/6 bg-base-200 shadow-xl mt-6">
            <div className="card-body min-h-1/2 w-full bg-accent rounded-t-lg"></div>
            <div className="card-body">
                <h2 className="card-title font-bold text-4xl">
                    {props.comp.name}
                </h2>
                {DateString(props.comp.start)} - {DateString(props.comp.end)}
            </div>
            </div>

            <div className="card w-5/6 bg-base-200 shadow-xl mt-6">
                <div className="card-body">
                    <h2 className="card-title font-bold text-4xl">Ranking</h2>
                    <div className="w-full h-full flex flex-row">
                        <div className="w-1/2 h-full">
                            <h1 className="text-lg font-semibold">FIRST Ranking</h1>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Team </th>
                                        <th>Record</th>
                                        <th>Ranking Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {first.map((ranking: any, index: number) => <tr key={ranking.team_key}>
                                        
                                        <th>{ranking.rank}</th>
                                        <td className="">{ranking.team_key.split("frc")[1]}</td>
                                        <td className="">{ranking.record.wins}-{ranking.record.ties}-{ranking.record.losses}</td>
                                        <td className="">{ranking.extra_stats}</td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>
                        <div className="divider divider-horizontal"></div>
                        <div className="w-1/2 h-full">
                            <h1 className="text-lg font-semibold">OPR Ranking</h1>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Team </th>
                                        <th>OPR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(oprs).map((key, index) => <tr key={key}>
                                        <th>{index+1}</th>
                                        <td className="">{key.split("frc")[1]}</td>
                                        <td className="">{oprs[key].toFixed(3)}</td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
         

      </Container>
    );
  }

export const getServerSideProps: GetServerSideProps = async (context) => {
    const eventKey = context.resolvedUrl.split("/event/")[1]
    const eventInformation = await tba.getCompetitionAutofillData(eventKey);
    const firstRanking = await tba.req.getCompetitonRanking(eventKey);
    const tbaOPR = await tba.req.getCompetitonOPRS(eventKey);

    return {
      props: {comp: JSON.parse(JSON.stringify(eventInformation)), firstRanking: firstRanking, oprRanking: tbaOPR},
    };
  };