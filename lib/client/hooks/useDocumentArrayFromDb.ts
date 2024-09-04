import { HasId } from "@/lib/Types";
import useDocument, { UseDocumentInstanceOptions } from "./useDocument";

export default function useDocumentArrayFromDb<T extends HasId>(options: UseDocumentInstanceOptions<T[]>) {
  return useDocument<T[]>(options, {
    fetchFunctions: [
      ({ localDb }) => localDb?.findObjects<T>(options.collection, options.query),
      ({ api }) => api.findMultiple<T>(options.collection, options.query)
    ],
    updateFunctions: [
      ({ localDb }, doc, changes) => {
        doc.forEach((d, i) => localDb?.updateObjectById(options.collection, d._id, (changes as any[])[i]));
      },
      ({ api }, doc, changes) => {
        doc.forEach((d, i) => api.update(options.collection, d._id, (changes as any[])[i]));
      }
    ]
  });
}