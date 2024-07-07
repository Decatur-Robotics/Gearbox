import Container from "@/components/Container"

export default function Fallback() {
  return (
    <Container requireAuthentication={false}>
      <div>
        <h1>Offline</h1>
        <p>Sorry, you are offline</p>
      </div>
    </Container>
  );
}