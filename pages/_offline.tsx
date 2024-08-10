import Container from "@/components/Container"
import { useEffect } from "react";

export default function Fallback() {
  useEffect(() => {
    setTimeout(location.reload, 2500);
  }, []);

  return (
    <Container requireAuthentication={false} title="Page Not Available Offline">
      <div>
        <h1>Offline</h1>
        <p>Sorry, you are offline and the page you&apos;re on can&apos;t be used offline.</p>
      </div>
    </Container>
  );
}