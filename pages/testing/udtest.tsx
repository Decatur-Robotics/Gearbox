import Container from "@/components/Container";
import ClientAPI from "@/lib/client/ClientAPI";
import CollectionId from "@/lib/client/CollectionId";
import useDocumentFromDb from "@/lib/client/hooks/useDocumentFromDb";
import { HasId, Season } from "@/lib/Types";
import { ObjectId } from "bson";
import { useEffect, useState } from "react";

const api = new ClientAPI("gearboxiscolol");

/**
 * REMOVE THIS BEFORE MERGING
 */
export default function UdTest() {
  const season = useDocumentFromDb<Season>({
    collection: CollectionId.Seasons,
    query: { slug: "crescendo15" },
    onFetch: (season) => {
      console.log("Fetched season", season);
    }
  });

  return (
    <Container requireAuthentication={false} title="useDocument Test">
      <h1 className="text-xl w-full text-center">useDocument Test</h1>
      <div className="flex flex-row">
        <div className="flex flex-col">
          <input type="text" defaultValue={season.value?.name} onChange={(e) => {
            season.set({...season.value!, name: e.target.value});
            season.saveChanges();
          }} />
        </div>
      </div>
    </Container>
  );
}