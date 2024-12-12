export namespace Statbotics {
	const BaseURL = "https://api.statbotics.io/v3";
	export interface TeamEvent {
		team: number;
		year: number;
		event: string;
		time: number;
		offseason: boolean;
		team_name: string;
		event_name: string;
		country: string;
		state: string;
		district: string;
		//type :  district ,
		week: number;
		//status :  Completed,
		epa: {
			total_points: {
				mean: number;
			};
			breakdown: {
				total_points: {
					mean: number;
				};
				auto_points: {
					mean: number;
				};
				teleop_points: {
					mean: number;
				};
				endgame_points: {
					mean: number;
				};
				total_notes: {
					mean: number;
				};
			};
		};
		record: {
			qual: {
				wins: number;
				losses: number;
				ties: number;
				winrate: number;
				rank: number;
			};
		};
		district_points: number;
	}

	async function statboticsRequest(subUrl: string): Promise<TeamEvent> {
		var res = await fetch(BaseURL + subUrl, {
			method: "GET",
		});
		return res.json();
	}

	export async function getTeamEvent(
		eventKey: string,
		teamNumber: number | string,
	) {
		const teamEvent = await statboticsRequest(
			`/team_event/${teamNumber}/${eventKey}`,
		);
		return teamEvent;
	}
}
