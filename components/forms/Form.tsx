import { AllianceColor, Report, FormData } from "@/lib/Types";
import { useCallback, useState, useEffect } from "react";
import { AutoPage, EndPage, PrematchPage, TeleopPage } from "./FormPages";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { TfiReload } from "react-icons/tfi";

import ClientAPI from "@/lib/client/ClientAPI";

const api = new ClientAPI("gearboxiscool");
//let io: Socket<DefaultEventsMap, DefaultEventsMap>;

export default function Form(props: { report: Report }) {
  const { session, status } = useCurrentSession();
  //const router = useRouter();

  const [page, setPage] = useState(0);
  const [formData, setFormData] = useState<FormData>(props.report?.data);
  const [syncing, setSyncing] = useState(false);

  const alliance = props.report?.color;

  async function submitForm() {
    await api.submitForm(props.report?._id, formData, session?.user?._id);
    console.log("yaya");
    location.href = location.href.substring(0, location.href.lastIndexOf("/"));
  }

  const sync = async () => {
    setSyncing(true);
    await api.updateReport({ data: formData }, props.report?._id);
    setSyncing(false);
  };

  const setCallback = useCallback(
    (key: any, value: boolean | string | number) => {
      setFormData((old) => {
        let copy = structuredClone(old);
        //@ts-ignore
        copy[key] = value;
        sync();
        return copy;
      });
    },
    [],
  );

  return (
    <div className="w-full h-screen flex flex-col items-center space-y-2">
      {page === 0 ? (
        <PrematchPage
          data={formData}
          callback={setCallback}
          alliance={alliance}
        ></PrematchPage>
      ) : (
        <></>
      )}
      {page === 1 ? (
        <AutoPage
          data={formData}
          callback={setCallback}
          alliance={alliance}
        ></AutoPage>
      ) : (
        <></>
      )}
      {page === 2 ? (
        <TeleopPage
          data={formData}
          callback={setCallback}
          alliance={alliance}
        ></TeleopPage>
      ) : (
        <></>
      )}
      {page === 3 ? (
        <EndPage
          data={formData}
          callback={setCallback}
          alliance={alliance}
          submit={submitForm}
        ></EndPage>
      ) : (
        <></>
      )}

      <footer className="w-full h-full ">
        <div className="card w-full bg-base-200">
          <div className="card-body flex flex-col items-center">
            <h2
              className={`${alliance === AllianceColor.Blue ? "text-blue-500" : "text-red-500"} font-bold text-5xl`}
            >
              #{[props.report.robotNumber]}
            </h2>
            <div className="card-actions justify-between w-full">
              <button
                className="btn btn-primary"
                disabled={page === 0}
                onClick={() => {
                  setPage(page - 1);
                }}
              >
                <FaArrowLeft />
                Back
              </button>

              {syncing ? (
                <p className="mt-3 text-sm md:text-md text-center">
                  {" "}
                  <TfiReload className="animate-spin inline-block"></TfiReload>{" "}
                  Syncing Changes
                </p>
              ) : (
                <></>
              )}

              <button
                className="btn btn-primary"
                disabled={page === 3}
                onClick={() => {
                  setPage(page + 1);
                }}
              >
                Next
                <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
