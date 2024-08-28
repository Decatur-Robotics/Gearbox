import { HasId } from "@/lib/Types";
import { useState } from "react";
import CollectionId from "../CollectionId";
import { ObjectId } from "bson";

export type UseDocumentOptions<T extends HasId | ArrayLike<HasId>> = {
  collection: CollectionId,
  query: object | ObjectId | ObjectId[],
}

export default function useDocument<T extends HasId | ArrayLike<HasId>>(options: UseDocumentOptions<T>) {
  const [document, setDocument] = useState<T>();
}