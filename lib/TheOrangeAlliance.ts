import { League, Team } from "./Types";

async function request(suburl: string): Promise<any> {
  var res = await fetch(process.env.TOA_URL + suburl, {
    method: "GET",
    headers: {
      "X-Application-Origin": process.env.TOA_APP_ID,
      "X-TOA-Key": process.env.TOA_KEY,
    },
  });

  return res.json();
}

export namespace TheOrangeAlliance {
  export type SimpleTeam = {
    /** Appears to be the same as team_number */
    team_key: string;
    region_key: string;
    league_key: string;
    team_number: number;
    team_name_short: string;
    team_name_long: string;
    robot_name: string;
    last_active: string;
    city: string;
    state_prov: string;
    zip_code: number;
    country: string;
    rookie_year: number;
    website: string;
  }

  export async function getTeam(teamNumber: number): Promise<Team | undefined> {
    const teams = await request(`/team/${teamNumber}`) as SimpleTeam[];

    if (teams.length === 0)
      return undefined;

    const team = teams[0];
    return new Team(team.team_name_short, team.team_name_long, team.robot_name, team.team_number, League.FTC);
  }
}