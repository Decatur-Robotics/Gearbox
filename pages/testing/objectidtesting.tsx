import Container from "@/components/Container";
import { useEffect, useState } from "react";
import { ObjectId } from "bson";
import ClientAPI from "@/lib/client/ClientAPI";
import Loading from "@/components/Loading";

const api = new ClientAPI("gearboxiscool");

/**
 * REMOVE THIS BEFORE MERGING
 */
export default function ObjectIdTesting() {
  const [id, setId] = useState<ObjectId>();

  useEffect(() => {
    console.log("Getting ObjectId...");
    api.getObjectId().then((res) => {
      console.log("Received ObjectId:", res);
      console.log("Received is an ObjectId:", res._id instanceof ObjectId);
      setId(res._id);
    });
  }, []);

  console.log("Rendering ObjectIdTesting...", id);

  return (
    <Container title="ObjectId Testing" requireAuthentication={false}>
      <div>
        {id ? <p>Generated ObjectId: {id.toString()}</p> : <Loading /> }
      </div>
    </Container>
  )
}