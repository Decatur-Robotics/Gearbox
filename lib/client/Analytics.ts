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

/**
 * Event parameters must be added as custom dimensions in Google Analytics. Go to Admin > Custom definitions.
 */
type EventParams = UaEventOptions & {
  teamNumber?: number;
  username?: string;
  league?: League;
  gameId?: GameId;
  compName?: string;
  usePublicData?: boolean;
  teamScouted?: number;
  targetName?: string;
}

if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID !== undefined && process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID !== "") {
  console.log("Initializing Google Analytics...");
  ReactGA.initialize(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID);
  console.log("Google Analytics initialized.");
}

function triggerEvent(params: EventParams) {
  if (!ReactGA._hasLoadedGA)
    console.error("Google Analytics not loaded");

  if (!ReactGA.isInitialized)
    console.error("Google Analytics not initialized");

  console.log("Event triggered:", params);
  const { action, ...options } = params;
  ReactGA.event(action, options);
}

export namespace Analytics {
  export function onboardingCompleted(name: string, teamNumber: number, league: League) {
    triggerEvent({
      category: EventCategory.User,
      action: "onboarding_complete",
      username: name,
      teamNumber,
      league
    });
  }

  export function newSignUp(name: string) {
    triggerEvent({
      category: EventCategory.User,
      action: "new_sign_up",
      username: name
    });
  }

  export function signIn(name: string) {
    triggerEvent({
      category: EventCategory.User,
      action: "sign_in",
      username: name
    });
  }

  export function teamCreated(number: number, league: League, username: string) {
    triggerEvent({
      category: EventCategory.Team,
      action: "create_team",
      teamNumber: number,
      username,
      league
    });
  }

  export function requestedToJoinTeam(teamNumber: number, username: string) {
    triggerEvent({
      category: EventCategory.Team,
      action: "request_to_join_team",
      teamNumber,
      username
    });
  }

  export function teamJoinRequestHandled(teamNumber: number, league: League, requesterName: string, doneByName: string, 
      accepted: boolean) {
    triggerEvent({
      category: EventCategory.Team,
      action: `team_join_request_${accepted ? "accepted" : "declined"}`,
      label: accepted ? "accepted" : "declined",
      teamNumber,
      username: doneByName,
      targetName: requesterName,
      league
    });
  }

  export function seasonCreated(gameId: GameId, teamNumber: number, username: string) {
    triggerEvent({
      category: EventCategory.Season,
      action: "create_season",
      gameId,
      teamNumber,
      username
    });
  }

  export function compCreated(compName: string, gameId: GameId, usePublicData: boolean, teamNumber: number, username: string) {
    triggerEvent({
      category: EventCategory.Season,
      action: "create_competition",
      compName,
      gameId,
      usePublicData,
      teamNumber,
      username
    });
  }

  export function quantReportSubmitted(teamScouted: number, teamNumber: number, compName: string, username: string) {
    triggerEvent({
      category: EventCategory.Comp,
      action: "submit_quantitative_report",
      teamNumber,
      username,
      compName,
      teamScouted
    });
  }

  export function pitReportSubmitted(teamScouted: number, teamNumber: number, compName: string, username: string) {
    triggerEvent({
      category: EventCategory.Comp,
      action: "submit_pit_report",
      teamNumber,
      username,
      compName,
      teamScouted
    });
  }

  export function subjectiveReportSubmitted(teamsWithComments: string[], teamNumber: number, compName: string, username: string) {
    triggerEvent({
      category: EventCategory.Comp,
      action: "submit_subjective_report",
      label: teamsWithComments.join(", "),
      teamNumber,
      username,
      compName
    });
  }
}