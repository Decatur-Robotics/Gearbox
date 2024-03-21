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
            This quick guide will help you setup Gearbox for your team's needs
          </p>
          <div className="divider"></div>
          <p>
            Gearbox is a tool designed to make your scouting workforce as
            efficient as possible. Gearboxes' goal is to make almost everything
            automated so all you need to worry about is actually scouting. To do
            this however, some setup is required to make sure everything is
            ready to go.
          </p>
          <p className="font-bold text-warning mt-2">
            Note: Gearbox is currently in Beta and reliablilty and performance
            is not guaranteed
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
              This may require you to sign in.
            </span>{" "}
          </p>
          <br></br>
          <p>
            Scrolling down, you can then search your teams number, click the
            result, and Gearbox will generate a new team that is prefilled with
            relevant properties.
          </p>
          <h1 className="text-xl font-semibold mt-2">Joining a Team</h1>
          <p>
            Alternatively if your team already has been added to gearbox you can
            request to join it via the join team search tool. This allows you to
            send a request to a join a team and then your teams management can
            accept you.
          </p>

          <div className="divider"></div>
          <h1 className="text-3xl font-semibold mb-2">Managing a Team</h1>
          <img src="/roster.png" className="w-1/2"></img>
          <p>
            Managers of a team have the special ability to appoint other
            managers which can toggle who is included in the scouting schedule
            and can also manage requests to the team. Additionally a team
            manager can change the teams settings and create
            seasons/competitions.
          </p>

          <div className="divider"></div>
          <h1 className="text-3xl font-semibold mb-2">Seasons</h1>
          <img src="/season.png" className="w-1/2"></img>
          <p>
            Gearbox divides your competitions into various seasons in order to
            make everything scalable and organized. For right now, there are
            only two options, the{" "}
            <span className="font-semibold">
              off-season and the current Crescendo season{" "}
            </span>
            . The off-season option is great for testing and off-season
            competitions and but Crescendo can be the home for your official
            competitions.
          </p>

          <div className="divider"></div>
          <h1 className="text-3xl font-semibold mb-2">Competitions</h1>
          <img src="/createComp.png" className="w-1/2"></img>
          <p>
            The page of your preferred season will then provide a link to a
            wizard which will allow you to quickly create a competition. This is
            how competitions are actually made in Gearbox. By entering the name
            of the relevant competiton and selecting the result, Gearbox will
            automatically fetch all relevant and available match/team
            information.
          </p>
          <br></br>
          <p>This is crayz</p>
        </div>
      </div>
    </Container>
  );
}
