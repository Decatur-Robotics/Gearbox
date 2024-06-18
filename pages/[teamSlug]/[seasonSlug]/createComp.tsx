import { CompetitonNameIdPair } from "@/lib/Types";
import React, { useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import Container from "@/components/Container";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import Loading from "@/components/Loading";

const api = new ClientAPI("gearboxiscool");

export default function CreateComp(props: ResolvedUrlData) {
  const team = props.team;
  const season = props.season;

  const [name, setName] = useState<string>("");
  const [results, setResults] = useState<
    { value: number; pair: CompetitonNameIdPair }[]
  >([]);
  const [selection, setSelection] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [creatingComp, setCreatingComp] = useState(false);
  const [usePublicData, setUsePublicData] = useState(true);

  const searchComp = async () => {
    if (!name) {
      return;
    }
    setLoading(true);
    setSelection(undefined);
    let data = await api.searchCompetitionByName(name);
    if (Object.keys(data).length === 0) {
      setResults([]);
    } else {
      setResults(data);
    }

    setLoading(false);
  };

  const createComp = async () => {
    setCreatingComp(true);

    if (selection === undefined) {
      return;
    }
    const autofill = await api.getCompetitionAutofillData(
      results[selection].pair.tbaId
    );

    const comp = await api.createCompetition(
      autofill.name,
      autofill.tbaId,
      autofill.start,
      autofill.end,
      season?._id,
      usePublicData
    );
    var win: Window = window;
    win.location = `/${team?.slug}/${season?.slug}/${comp.slug}`;
  };

  useEffect(() => {
    searchComp();
  }, [name]);

  return (
    <Container requireAuthentication={true} hideMenu={false}>
      <Flex center={true} mode="col" className="w-full h-92 my-10">
        <Card title={"Create Competition"} className="w-1/3">
          <div>
            <h1>Search for a competition</h1>
            <div className="divider"></div>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              className="input input-bordered w-full mb-4"
              placeholder={"Competition Name"}
              disabled={creatingComp}
            />
            <div className="w-full h-64 space-y-2 ">
              {loading || name.length < 3 ? (
                // <Loading></Loading>
                <></>
              ) : (
                results.map((e, i) => (!creatingComp || i === selection) ? (
                  <h1
                    key={e.pair.name}
                    className={
                      "bg-base-300 text-sm p-2 rounded-lg border-4 border-base-300 " +
                      (selection === i
                        ? "border-primary"
                        : "hover:border-primary")
                    }
                    onClick={() => {
                      setSelection(i);
                    }}
                  >
                    {e.pair.name}
                  </h1>
                ) : <></>)
              )}
            </div>
          </div>
          {selection !== undefined && selection >= 0 ? 
              (creatingComp 
                ? (
                  <progress className="progress w-full" />
                ) 
                : (
                  <div className="pt-4">
                    <div className="flex flex-row justify-between pb-4">
                      <div>
                        <p className="text-2xl">Make data publicly available?</p>
                        <p>
                          Making your data publicly available helps smaller teams make informed decisions during alliance selection. 
                          Don&apos;t worry - no identifying information will be shared and comments will be hidden; only quantitative
                          data will be shared.<br/>This setting can be changed at any time.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        id="toggle-public-data"
                        defaultChecked={usePublicData}
                        onChange={(e) => setUsePublicData(e.target.checked)}
                      />
                    </div>
                    <button className="btn btn-primary w-full" onClick={createComp}>
                      Create Competition
                    </button>
                  </div>
                ))
           : (
              <></>
          )}
        </Card>
      </Flex>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  };
};
