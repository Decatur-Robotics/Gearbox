import { download } from "@/lib/client/ClientUtils";
import { mergeSavedComps } from "@/lib/client/offlineUtils";
import { SavedCompetition, League, Team, Competition } from "@/lib/Types";
import { useState, ChangeEvent } from "react";

export default function DownloadModal(props: { 
    open: boolean, 
    close: () => void, 
    team: Team, 
    comp: Competition, 
    getSavedComp: () => SavedCompetition | undefined
    setSavedComp: (comp: SavedCompetition) => void
  }) {
  const { team, comp } = props;

  const [uploadedComp, setUploadedComp] = useState<SavedCompetition | undefined>(undefined);

  function downloadJson() {
    const savedComp = props.getSavedComp();
    download(`${team?.league ?? League.FRC}${team?.number}-${comp?.name}.json`, JSON.stringify(savedComp), "application/json");
  }

  function uploadComp(e: ChangeEvent<HTMLInputElement>) {
    console.log("Uploading comp...");
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target?.result as string) as SavedCompetition;
      setUploadedComp(data);
      console.log("Uploaded comp", data);
    }

    reader.readAsText(file);
  }

  function importComp() {
    const current = props.getSavedComp();

    if (!current || !uploadedComp) return;

    mergeSavedComps(current, uploadedComp);
    props.setSavedComp(current);
  }

  return (
    <dialog id="download-modal" className="modal" open={props.open}>
      <div className="modal-box">
        <button onClick={props.close} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">X</button>
        <h1 className="text-xl">Share Competition</h1>
        <button onClick={downloadJson} className="btn btn-primary mt-2 w-full">
          Download JSON
        </button>
        <div className="divider"></div>
        <h1 className="text-xl">Import Competition Reports</h1>
        <input onChange={uploadComp} id="file" name="file" type="file" accept=".json" className="file-input w-full" />
        <br />
        <button onClick={importComp} className={`btn btn-${uploadedComp ? "primary" : "disabled"} mt-2 w-full`}>
          Import{uploadedComp && ` ${uploadedComp.team?.league ?? "FRC"} ${uploadedComp.team?.number} - ${uploadedComp.comp.name}`}
        </button>
      </div>
    </dialog>
  )
}