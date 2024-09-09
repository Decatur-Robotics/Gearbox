import { HasId } from "@/lib/Types";
import { useEffect, useState } from "react";
import CollectionId from "../CollectionId";
import { ObjectId } from "bson";
import ClientAPI from '../ClientAPI';
import MiniMongoInterface, { useLocalDb } from "../MiniMongoInterface";
import useDynamicState from "./useDynamicState";

export type Changes<T> = Partial<{
  [P in keyof T]?: Changes<T[P]> | T[P]
}>;

type Interfaces = {
  api: ClientAPI,
  localDb?: MiniMongoInterface
}

type FetchFunction<T extends HasId | HasId[]> = (interfaces: Interfaces) => Promise<T | null | undefined> | void;
type UpdateFunction<T extends HasId | HasId[]> = (interfaces: Interfaces, original: T, changes: Changes<T>) => Promise<void> | void;

export type UseDocumentInstanceOptions<T extends HasId | HasId[]> = {
  collection: CollectionId,
  query: object | ObjectId,
  onFetch?: (document: T | null | undefined) => void,
  dontLoadIf?: () => boolean
}

export type UseDocumentHookOptions<T extends HasId | HasId[]> = {
  fetchFunctions: FetchFunction<T>[],
  updateFunctions: UpdateFunction<T>[]
}

export type UseDocumentResult<T extends HasId | HasId[]> = {
  value: T | undefined;
  set: (value: T) => void;
  saveChanges: () => void;
  fetchLatestCopy: (preserveChanges: boolean) => void;
}

function getChanges<T>(original: T, current: T): Changes<T>[] | Changes<T> {
  if (typeof current !== typeof original)
    return current;

  if (Array.isArray(current) && Array.isArray(original)) {
    const changes: Changes<any>[] = [];

    for (let i = 0; i < current.length; i++) {
      if (typeof original[i] !== typeof current[i]) {
        changes[i] = current[i];
      }

      if (typeof current[i] === "object") {
        changes[i] = getChanges(original[i], current[i]);
      }

      if (current[i] !== original[i]) {
        changes[i] = current[i];
      }
    }

    return changes;
  }

  const changes: Changes<T> = {};

  for (const key in current) {
    if (typeof original[key] !== typeof current[key]) {
      changes[key] = current[key];
    }

    if (typeof current[key] === "object") {
      changes[key] = getChanges(original[key], current[key]);
    }

    if (current[key] !== original[key]) {
      changes[key] = current[key];
    }
  }

  return changes;
}

function applyChanges<T>(original: T, changes: Changes<T>): T {
  if (Array.isArray(original)) {
    if (!Array.isArray(changes))
      throw new Error("Changes must be an array if the original is an array");

    return (original as any[]).map((item, i) => applyChanges(item, changes[i])) as T;
  }

  const newObject = { ...original };

  for (const key in changes) {
    if (typeof changes[key] === "object") {
      newObject[key] = applyChanges(original[key], changes[key]);
    } else {
      // I don't like disabling the type check here, but I don't know how to fix it
      newObject[key] = changes[key] as any;
    }
  }

  return newObject;
}

const api = new ClientAPI("gearboxiscool");

/**
 * Do NOT use this hook outside of another hook. It's meant to create a modular way to update database resources.
 * 
 * @param instanceOptions Options for a specific usage of a hook. This parameter should be exposed by child hooks.
 * @param hookOptions Options for a specific child hook. This parameter should not be exposed by parent hooks.
 * @returns An object containing the document and functions to interact with it.
 */
export default function useDocument<T extends HasId | HasId[]>(
  instanceOptions: UseDocumentInstanceOptions<T>, 
  hookOptions: UseDocumentHookOptions<T>
): UseDocumentResult<T> {
  const localDb = useLocalDb();

  const [document, setDocument, getDocument] = useDynamicState<T>();
  const [originalDocument, setOriginalDocument] = useState<T>();

  function onFetch(newDocument: T, preserveChanges: boolean) {
    let changedDocument = newDocument;
    if (preserveChanges) {
      const changes = getChanges(document!, newDocument);
      changedDocument = applyChanges(newDocument!, changes);
    }
    
    setDocument(changedDocument);
    setOriginalDocument(newDocument);
  }

  async function fetchLatestCopy(preserveChanges: boolean = true) {
    if (!localDb)
      return;

    if (instanceOptions.dontLoadIf?.() ?? true)
      return;
    
    if (instanceOptions.query instanceof ObjectId) {
      instanceOptions.query = { _id: instanceOptions.query };
    }
    
    hookOptions.fetchFunctions.forEach(async (fetchFunction) => {
      fetchFunction({ api, localDb })
      ?.then((newDocument) => {
          if (newDocument)
            onFetch(newDocument, preserveChanges);

          instanceOptions.onFetch?.(newDocument);
        })
        .catch(console.error);
    });
  }

  useEffect(() => {
    console.log("Fetching latest copy");
    fetchLatestCopy();
  }, [localDb, JSON.stringify(instanceOptions.query)]); // We use JSON.stringify because the object reference changes every render

  async function saveChanges() {
    getDocument((currentDocument) => {
      if (!currentDocument || !originalDocument)
        return;

      const changes = getChanges(currentDocument, originalDocument);

      // If there are no changes, do nothing
      if (!changes || Object.keys(changes).length === 0)
        return;

      hookOptions.updateFunctions.forEach(async (updateFunction) => {
        if (instanceOptions.query instanceof ObjectId)
          instanceOptions.query = { _id: instanceOptions.query };

        updateFunction({ api, localDb }, originalDocument, changes)
          ?.catch(console.error);
      });
    });
  }

  return {
    value: document,
    set: setDocument,
    saveChanges,
    fetchLatestCopy
  };
}