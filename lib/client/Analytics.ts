import ReactGA from "react-ga4";
import { League, User, Team } from '../Types';
import { UaEventOptions } from "react-ga4/types/ga4";
import { GameId } from "./GameId";

enum EventCategory {
  User = "User",
  Team = "Team",
  Season = "Season",
  Comp = "Competition",
}

if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID !== undefined && process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID !== "")
  ReactGA.initialize(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID);

function triggerEvent(optionsOrName: string | UaEventOptions) {
  if (!ReactGA._hasLoadedGA)
    console.error("Google Analytics not loaded");

  if (!ReactGA.isInitialized)
    console.error("Google Analytics not initialized");

  console.log("Event triggered:", optionsOrName);
  ReactGA.event(optionsOrName);
}

export namespace Analytics {
  export function onboardingCompleted(name: string, teamNumber: number, league: League) {
    triggerEvent({
      category: EventCategory.User,
      action: "onboarding_complete",
      label: `${name} joined ${league} ${teamNumber}`
    });
  }

  export function newSignUp(name: string) {
    triggerEvent({
      category: EventCategory.User,
      action: "new_sign_up",
      label: name
    });
  }

  export function signIn(name: string) {
    triggerEvent({
      category: EventCategory.User,
      action: "sign_in",
      label: name
    });
  }

  export function teamCreated(number: number, name: string, league: League, username: string) {
    triggerEvent({
      category: EventCategory.Team,
      action: "create_team",
      label: `Team ${number} - ${name} (${league}) by ${username}`
    });
  }

  export function requestedToJoinTeam(teamId: string, username: string) {
    triggerEvent({
      category: EventCategory.Team,
      action: "request_to_join_team",
      label: `Team ${teamId} by ${username}`
    });
  }

  export function teamJoinRequestHandled(teamNumber: number, league: League, requesterName: string, doneByName: string, 
      accepted: boolean) {
    triggerEvent({
      category: EventCategory.Team,
      action: `team_join_request_${accepted ? "accepted" : "declined"}`,
      label: `${league} ${teamNumber} by ${requesterName} ${accepted ? "Accepted" : "Declined"} by ${doneByName}`
    });
  }

  export function seasonCreated(gameId: GameId, teamNumber: number, username: string) {
    triggerEvent({
      category: EventCategory.Season,
      action: "create_season",
      label: `${gameId} for team ${teamNumber} by ${username}`
    });
  }

  export function compCreated(compName: string, gameId: GameId, usePublicData: boolean, teamNumber: number, username: string) {
    triggerEvent({
      category: EventCategory.Season,
      action: "create_competition",
      label: `${compName} for ${gameId} by ${teamNumber} ${username} (public: ${usePublicData})`
    });
  }

  export function quantReportSubmitted(teamScouted: number, teamNumber: number, compName: string, username: string) {
    triggerEvent({
      category: EventCategory.Comp,
      action: "submit_quantitative_report",
      label: `${teamScouted} for ${compName} by ${teamNumber} ${username}. `
    });
  }

  export function pitReportSubmitted(teamScouted: number, teamNumber: number, compName: string, username: string) {
    triggerEvent({
      category: EventCategory.Comp,
      action: "submit_pit_report",
      label: `${teamScouted} for ${compName} by ${teamNumber} ${username}`
    });
  }

  export function subjectiveReportSubmitted(teamsWithComments: string[], teamNumber: number, compName: string, username: string) {
    triggerEvent({
      category: EventCategory.Comp,
      action: "submit_subjective_report",
      label: `[${teamsWithComments.join(", ")}] for ${compName} by ${teamNumber} ${username}`
    });
  }
}