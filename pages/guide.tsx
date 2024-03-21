import Container from "@/components/Container";

export default function Guide() {
  return (
    <Container
      requireAuthentication={false}
      hideMenu={true}
      notForMobile={true}
    >
      <div className="w-full h-full flex justify-center">
        <div className="w-full md:w-1/2 min-h-screen flex flex-col items-center mt-4 indent-8">
          <h1 className="text-4xl font-bold">Gearbox Team Guide</h1>
          <p>
            This quick guide will help you get up and running with
            Gearbox.
          </p>
          <div className="divider"></div>
          <p>
            Gearbox is a tool designed to make your scouting workforce as
            efficient as possible. Gearboxes goal is to make almost everything
            automated so all you need to worry about is actually scouting. To do
            this however, some setup is required to make sure everything is
            ready to go.
          </p>
          <p className="font-bold text-warning mt-2">
            Note: Gearbox is currently in Beta and reliablilty and performance
            is not guaranteed
          </p>
          <p className="font-bold text-warning mt-2">
            Note: Gearbox currently only supports Qualifying matches
          </p>
          <div className="divider"></div>
          <h1 className="text-3xl font-semibold">Joining or Making a Team</h1>
          <h1 className="text-xl font-semibold mt-2">Create a New Team</h1>

          <img src="/team.png" className="w-1/2"></img>
          <p>
            The first thing to do is become part of your team. If your team is
            entirely new to Gearbox you can add your team by going to your
            <a href="/profile" className="text-accent">
              {" "}
              profile{" "}
            </a>
            and clicking the link to create your team.{" "}
            <span className="font-semibold">
              <br></br>
              This requires you to create an account/sign in.
            </span>{" "}
          </p>
          <br></br>
          <p>
            After reaching your profile you can then click the create a team
            button, then search for your teams number, click the
            your teams name, and Gearbox will generate a new team that is 
            prefilled with relevant properties.
          </p>
          <h1 className="text-xl font-semibold mt-2">Joining a Team</h1>
          <p>
            If your team has already joined gearbox you can
            request to be added to it via the join team searchbox.
            Type your teams number into the searchbox then click
            the team name to send a join request.
          </p>

          <div className="divider"></div>
          <h1 className="text-3xl font-semibold mb-2">Managing a Team</h1>
          <img src="/roster.png" className="w-1/2"></img>
          <p>
            Team managers have the ability to appoint other managers,
            this means you can appoint other trusted members of your team
            to help manage your scouting.
            
            Managers can toggle who is assigned to scout,
            manage requests to join the team, change the teams settings,
            and create seasons/competitions.
          </p>

          <div className="divider"></div>
          <h1 className="text-3xl font-semibold mb-2">Seasons</h1>
          <img src="/season.png" className="w-1/2"></img>
          <p>
            Gearbox divides your competitions into various seasons in order to
            make everything scalable and organized. Currently there are
            only two options, the{" "}
            <span className="font-semibold">
              off-season and the current (Crescendo) season.{" "}
            </span>
            The off-season option is great for getting used to
            gearbox and scouting off-season competitions, but
            you should use the current season(Crescendo) for official
            competitions.
          </p>

          <div className="divider"></div>
          <h1 className="text-3xl font-semibold mb-2">Competitions</h1>
          <img src="/createComp.png" className="w-1/2"></img>
          <p>
            Competitions hold all of the relavant data concerning your
            current matches and particpating teams. Statistics on your scouting
            performance will be displayed at the top of the page along with
            buttons to view your competition stats, pit-stats (our slideshow for pit
            display) and relevant rankings. When match data is available you
            can click the refresh button which will attempt to pull the latest
            match data from FRC servers and automatically generate matches. 
            Once data is available, you can then assign scouters which,
            will generate a set of matches for every selected scouter
            to cover.
          </p>
          <br></br>
          <p>
            Pitscouting forms are available, which any member of the team can access.
            Pitscouting provides a seperate form you can upload an
            image of the robot and record its capabilities(such as drivetrain,
            climber status, and ability to fit under the stage.
          </p>

          <div className="divider"></div>
          <h1 className="text-3xl font-semibold mb-2">Manual Match Creation</h1>
          <img src="/createComp.png" className="w-1/2"></img>
          <p>
            In the event that gearbox does not have access to
            match data provided by FIRST, a team manager can
            manually create matches by entering the teams playing
            in the match and the match number. 
            You will need to re-assign scouters after manually creating
            a match, as the match wont have any scouters assigned by default.
          </p>
        </div>
      </div>
    </Container>
  );
}
