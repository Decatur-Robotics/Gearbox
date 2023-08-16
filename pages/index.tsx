import Container from "@/components/Container";

export default function Homepage() {

    return <Container requireAuthentication={false} hideMenu={true}>
            <div className="hero min-h-screen bg-base-200">
                <div className="hero-content text-center">
                    <div className="max-w-md">
                        <h1 className="text-5xl font-bold">Welcome to <span className="text-accent">Gearbox</span></h1>
                        <p className="py-6">A Fully Customizable, Modular Scouting Platform For FIRST Robotics</p>
                        <a className="btn btn-primary normal-case" href="profile">Get Started</a>
                    </div>
                </div>
        </div>
    </Container>

}