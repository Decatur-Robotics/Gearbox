import CompetitionIndex from "@/components/CompetitionIndex";
import Container from "@/components/Container";
import { getAllCompsFromLocalStorage } from "@/lib/client/offlineUtils";
import { SavedCompetition } from "@/lib/Types";
import { useEffect, useState } from "react";

export default function CompetitionPage() {
  const [savedComp, setSavedComp] = useState<SavedCompetition | undefined>(undefined);
  const [allSavedComps, setAllSavedComps] = useState<SavedCompetition[]>([]);

  useEffect(() => {
    setAllSavedComps(getAllCompsFromLocalStorage().sort((a, b) => b.lastAccessTime - a.lastAccessTime));
  }, [savedComp]);

  return (
    <Container requireAuthentication={false}>
      <label className="form-control">
        <div className="label">
          <span className="label-text">Select a competition</span>
        </div>
        <select defaultValue="unselected"  onChange={(e) => setSavedComp(allSavedComps.find(comp => comp.comp._id === e.target.value))}>
          <option disabled selected value="unselected">Select a competition</option>
          {
            allSavedComps.map((comp) =>
              <option key={comp.comp._id} value={comp.comp._id}>{comp.team?.league ?? "FRC"} {comp.team?.number} - {comp.comp.name}</option>
            )
          }
        </select>
      </label>
      { savedComp &&
          <CompetitionIndex team={savedComp.team} seasonSlug={savedComp.seasonSlug} competition={savedComp.comp} 
            fallbackData={savedComp}/>
      }
    </Container>
  )
}