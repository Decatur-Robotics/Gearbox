import Container from "@/components/Container";
import { AllianceColor, Report, FormData } from "@/lib/Types";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Form from "@/components/forms/Form";

const data = new FormData();
const report = new Report("", data, 4026, AllianceColor.Red, "", 0);
export default function Homepage() {

    const { session, status } = useCurrentSession();
    const hide = status === "authenticated";
    

    return <Container requireAuthentication={false} hideMenu={!hide}>
        <Form report={report}></Form>

           
    </Container>

}