import ClientAPI from "@/lib/client/ClientAPI";
import { download } from "@/lib/client/ClientUtils";
import { mergeSavedComps, updateCompInLocalStorage } from "@/lib/client/offlineUtils";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import useIsOnline from "@/lib/client/useIsOnline";
import { SavedCompetition, League, Team, Competition, Report, Pitreport, SubjectiveReport } from "@/lib/Types";
import { useState, ChangeEvent } from "react";
import Loading from "../Loading";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";

const api = new ClientAPI("gearboxiscool");

export default function DownloadModal(props: { 
    open: boolean, 
    close: () => void, 
    team: Team, 
    comp: Competition, 
    getSavedComp: () => SavedCompetition | undefined
    setSavedComp: (comp: SavedCompetition) => void
  }) {
  const { team, comp } = props;

  const { session, status } = useCurrentSession();
  const isManager = session?.user?._id
    ? team?.owners.includes(session.user?._id)
    : false;

  const [uploadedComp, setUploadedComp] = useState<SavedCompetition | undefined>(undefined);
  const [uploadingToCloud, setUploadingToCloud] = useState(false);

  const isOnline = useIsOnline();
  
  function downloadJson() {
    const savedComp = props.getSavedComp();
    download(`${team?.league ?? League.FRC}${team?.number}-${comp?.name}.json`, JSON.stringify(savedComp), "application/json");
  }

  function uploadCompFromFile(e: ChangeEvent<HTMLInputElement>) {
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

  function uploadCompToCloud() {
    const savedComp = props.getSavedComp();
    if (!savedComp) return;

    setUploadingToCloud(true);
    try {
      api.uploadSavedComp(savedComp);
    }
    catch (e) {
      console.error(e);
    }
    setUploadingToCloud(false);
  }

  /**
   * Untested because my laptop doesn't have a camera.
   *  - Renato
   */
  function readQrCode(code: IDetectedBarcode[]) {
    console.log("Found QR code...");
    if (!confirm("Scan QR code?"))
      return;

    console.log("Reading QR code...");
    type QrData = {
      quantReport?: Report,
      pitReport?: Pitreport,
      subjectiveReport?: SubjectiveReport
    }

    const data = code[0].rawValue;
    const qrData = JSON.parse(data) as QrData;
    console.log("Read QR code");

    if (!qrData.quantReport && !qrData.pitReport && !qrData.subjectiveReport) {
      console.error("Invalid QR code data", qrData);
      return;
    }

    if (!props.comp._id)
      return;

    updateCompInLocalStorage(props.comp._id, (comp) => {
      if (qrData.quantReport) {
        if (!qrData.quantReport._id) {
          console.error("Quant report has no _id", qrData.quantReport);
          return;
        }

        comp.quantReports[qrData.quantReport._id] = qrData.quantReport;
      }
      
      if (qrData.pitReport) {
        if (!qrData.pitReport._id) {
          console.error("Pit report has no _id", qrData.pitReport);
          return;
        }

        comp.pitReports[qrData.pitReport._id] = qrData.pitReport;
      }

      if (qrData.subjectiveReport) {
        if (!qrData.subjectiveReport._id) {
          console.error("Subjective report has no _id", qrData.subjectiveReport);
          return;
        }

        comp.subjectiveReports[qrData.subjectiveReport._id] = qrData.subjectiveReport;
        comp.matches[qrData.subjectiveReport.match].subjectiveReports.push(qrData.subjectiveReport._id);
      }
    })
  }

  return (
    <dialog id="download-modal" className="modal" open={props.open}>
      <div className="modal-box">
        <button onClick={props.close} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">X</button>
        <h1 className="text-xl">Share Competition</h1>
        <button onClick={downloadJson} className="btn btn-primary mt-2 w-full">
          Download JSON
        </button>
        <div className="divider" />
        <h1 className="text-xl">Import Competition Reports</h1>
        <input onChange={uploadCompFromFile} id="file" name="file" type="file" accept=".json" className="file-input w-full" />
        <br />
        <button onClick={importComp} className={`btn btn-${uploadedComp ? "primary" : "disabled"} mt-2 w-full`}>
          Import{uploadedComp && ` ${uploadedComp.team?.league ?? "FRC"} ${uploadedComp.team?.number} - ${uploadedComp.comp.name}`}
        </button>
        <div className="divider" />
        { isManager &&
          <>
            <button onClick={uploadCompToCloud} className={`btn btn-${isOnline && !uploadingToCloud ? "primary" : "disabled"}`}>
              {!uploadingToCloud ? "Upload local data" : <Loading />}
            </button>
            <div className="divider" />
          </>
        }
        <h1 className="text-xl">Read QR Data</h1>
        <Scanner onScan={readQrCode}/>
      </div>
    </dialog>
  )
}