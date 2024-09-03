import { HasId } from "@/lib/Types";
import useDocument, { UseDocumentInstanceOptions } from "./useDocument";

export default function useDocumentFromDb<T extends HasId>(options: UseDocumentInstanceOptions<T>) {
  return useDocument<T>(options, {
    fetchFunctions: [
      ({ localDb }) => localDb?.findObject<T>(options.collection, options.query),
      ({ api }) => api.find<T>(options.collection, options.query)
    ],
    updateFunctions: [
      ({ localDb }, doc, changes) => localDb?.updateObjectById(options.collection, doc._id, changes),
      ({ api }, doc, changes) => api.update(options.collection, doc._id, changes)
    ]
  });
}