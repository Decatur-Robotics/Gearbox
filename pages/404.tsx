import Container from "@/components/Container";

export default function Homepage() {

    return <Container requireAuthentication={false} hideMenu={true}>
        <div className="w-full min-h-screen flex flex-col">
            <div className="hero min-h-screen bg-base-200">
                <div className="hero-content text-center">
                    
                    <div className="max-w-md flex flex-col items-center">
                        <h1 className="text-6xl font-bold">404</h1>
                        <div className="divider"></div>
                        <h1 className="text-3xl font-semibold">Hey!</h1>
                        <p className="py-6">You Should Not Be Here!</p>
                    </div>
                </div>
            </div>
        </div>
           
    </Container>

}