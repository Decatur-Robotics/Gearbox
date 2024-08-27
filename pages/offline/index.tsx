import CompetitionIndex from "@/components/competition/CompetitionIndex";
import Container from "@/components/Container";
import { getAllCompsFromLocalStorage, saveCompToLocalStorage } from "@/lib/client/offlineUtils";
import { SavedCompetition } from "@/lib/Types";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";

export default function SelectCompetitionPage() {
  const [allSavedComps, setAllSavedComps] = useState<SavedCompetition[]>([]);

  useEffect(() => {
    setAllSavedComps(getAllCompsFromLocalStorage().sort((a, b) => b.lastAccessTime - a.lastAccessTime));
  }, []);

  function fileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target?.result as string) as SavedCompetition;
      saveCompToLocalStorage(data);

      window.location.href = `/offline/${data.comp._id}`;
    }

    reader.readAsText(file);
  }

  function formatCompName(comp: SavedCompetition) {
    return `${comp.team?.league ?? "FRC"} ${comp.team?.number} - ${comp.comp.name}`;
  }

  return (
    <Container requireAuthentication={false} title="Select an Offline Competition">
      <div className="flex flex-col items-center p-8 space-y-6">
        <div className="card bg-base-200 w-[80%] shadow-xl">
          <div className="card-body">
            <h1 className="card-title">
              Select a saved competition
            </h1>
            <div className="card-actions flex flex-col w-[40%]">
              {
                allSavedComps.map(comp => (
                  <Link key={comp.comp._id.toString()} href={`offline/${comp.comp._id}`} className="btn btn-primary w-full">
                    {formatCompName(comp)}
                  </Link>
                ))
              }
            </div>
          </div>
        </div>
        <div className="card bg-base-200 w-[80%] shadow-xl">
          <div className="card-body">
            <h1 className="card-title">Upload a competition</h1>
            <div className="card-actions">
              <input type="file" className="file-input" onChange={fileSelected} />
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}