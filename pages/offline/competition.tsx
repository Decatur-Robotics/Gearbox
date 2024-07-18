import CompetitionIndex from "@/components/competition/CompetitionIndex";
import Container from "@/components/Container";
import { getAllCompsFromLocalStorage, saveCompToLocalStorage } from "@/lib/client/offlineUtils";
import { SavedCompetition } from "@/lib/Types";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Form from '../../components/forms/Form';

export default function CompetitionPage() {
  const [savedComp, setSavedComp] = useState<SavedCompetition | undefined>(undefined);
  const [allSavedComps, setAllSavedComps] = useState<SavedCompetition[]>([]);
  const [loadFromFile, setLoadFromFile] = useState(false);
  const [uploadedComp, setUploadedComp] = useState<SavedCompetition | undefined>(undefined);
  const [lastSelectedComp, setLastSelectedComp] = useState<string | undefined>(undefined);

  useEffect(() => {
    setAllSavedComps(getAllCompsFromLocalStorage().sort((a, b) => b.lastAccessTime - a.lastAccessTime));
    setLastSelectedComp(localStorage.getItem("lastSelectedOfflineComp") ?? undefined);
  }, [savedComp]);

  function selectComp(id: string) {
    if (id === "load") {
      setLoadFromFile(true);
      setSavedComp(undefined);
      return;
    }

    setLoadFromFile(false);

    const comp = allSavedComps.find(comp => comp.comp._id === id);
    if (!comp)
      return;
    
    localStorage.setItem("lastSelectedOfflineComp", id);
    setSavedComp(comp)
  }

  useEffect(() => {
    selectComp(lastSelectedComp ?? "unselected");
  }, [allSavedComps, lastSelectedComp]);

  function fileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target?.result as string) as SavedCompetition;
      setUploadedComp(data);
    }

    reader.readAsText(file);
  }

  function selectUploadedComp() {
    if (!uploadedComp) return;

    saveCompToLocalStorage(uploadedComp);
    setSavedComp(uploadedComp);
    setLoadFromFile(false);
  }

  function formatCompName(comp: SavedCompetition) {
    return `${comp.team?.league ?? "FRC"} ${comp.team?.number} - ${comp.comp.name}`;
  }

  return (
    <Container requireAuthentication={false}>
      <label className="form-control">
        <div className="label">
          <span className="label-text">Select a competition</span>
        </div>
        <select defaultValue={lastSelectedComp} onChange={(e) => selectComp(e.target.value)}>
          <option disabled selected value="unselected">
            { allSavedComps.find(comp => comp.comp._id === lastSelectedComp) 
                ? formatCompName(allSavedComps.find(comp => comp.comp._id === lastSelectedComp)!) 
                : "Select a competition"
            }
          </option>
          {
            allSavedComps.map((comp) =>
              <option key={comp.comp._id} value={comp.comp._id}>{formatCompName(comp)}</option>
            )
          }
          <option value="load">Load from file...</option>
        </select>
      </label>
      { savedComp &&
          <CompetitionIndex team={savedComp.team} seasonSlug={savedComp.seasonSlug} competition={savedComp.comp} 
            fallbackData={savedComp}/>
      }
      { loadFromFile &&
          <div className="flex flex-col w-1/3 my-6 space-y-2 ml-2">
            <input id="file" name="file" type="file" accept=".json" className="file-input" onChange={fileSelected} />
            <button onClick={selectUploadedComp} className={`btn btn-${uploadedComp ? "primary" : "disabled"}`}>
              Select{uploadedComp && ` ${formatCompName(uploadedComp)}`}
            </button>
          </div>
      }
    </Container>
  )
}