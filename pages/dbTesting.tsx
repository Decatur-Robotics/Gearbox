import Container from "@/components/Container";
import CollectionId from "@/lib/client/CollectionId";
import { useLocalDb } from "@/lib/client/MiniMongoInterface";
import { ObjectId } from "bson";
import React from "react";
import { useEffect, useState } from "react";

export default function DbTesting() {
  const dbInterface = useLocalDb();
  const db = dbInterface?.db;

  const [collections, setCollections] = useState<{ [name: string]: object[] }>();

  const collectionSelectRef = React.createRef<HTMLSelectElement>();

  function updateCollections() {
    if (!db)
      return;
    
    const promises: Promise<any>[] = [];
    const collections: { [name: string]: object[] } = {};
    
    db.getCollectionNames().forEach((collectionName) => {
      promises.push(dbInterface.findObjects<object>(collectionName as CollectionId, {})
                      .then((objects) => collections[collectionName] = objects));
    });

    Promise.all(promises).then(() => setCollections(collections));
  }

  useEffect(() => {
    updateCollections();
  }, [db]);

  function addDocument() {
    const collectionName = collectionSelectRef.current?.value;
    if (!collectionName)
      return;

    const collection = db?.collections[collectionName];
    if (!collection)
      return;

    console.log("Adding document to collection: " + collectionName);
    const document = {
      _id: new ObjectId(),
      name: "Test",
      addedAt: new Date()
    }
    console.log(document);

    dbInterface?.addObject(collectionName as CollectionId, document).then(() => {
      console.log("Document added to collection: " + collectionName);
      updateCollections();
    });
  }

  return (
    <Container requireAuthentication={false} title="DB Testing">
      <h1 className="text-xl w-full text-center">DB Testing</h1>
      <div className="flex flex-row">
        <div className="w-1/2">
          <h2>Add Document</h2>
          <select ref={collectionSelectRef}>
            {
              db && db.getCollectionNames().map((collectionName, index) => (
                <option key={index}>{collectionName}</option>
              ))
            }
          </select>
          <button onClick={addDocument}>Add</button>
        </div>
        <div className="w-1/2 flex flex-col space-y-2">
          {
            collections && Object.entries(collections).map(([collectionName, documents]) => (
              <div key={collectionName} className="collapse bg-base-200">
                <input type="checkbox" />
                <h2 className="collapse-title">{collectionName}</h2>
                <ul className="pl-4 text-sm collapse-content">
                  {
                    documents.map((object: any, index) => (
                      <li key={index} className="mb-2">{JSON.stringify(object)}</li>
                    ))
                  }
                </ul>
              </div>
            ))
          }
        </div>
      </div>
    </Container>
  );
}