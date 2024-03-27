import { CompetitonNameIdPair } from "@/lib/Types";
import { useEffect, useState } from "react";

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
  const [selection, setSelection] = useState<number | undefined>(0);
  const [loading, setLoading] = useState(false);

  const searchComp = async () => {
    if (!name) {
      return;
    }
    setLoading(true);
    setSelection(undefined);
    let data = await api.searchCompetitionByName(name);
    setResults(data);
    setLoading(false);
  };

  const createComp = async () => {
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
      season?._id
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
          <h1>Search for a competition</h1>
          <div className="divider"></div>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            className="input input-bordered"
            placeholder={"Competition Name"}
          ></input>
          <div className="w-full h-86 space-y-2 ">
            {loading || name.length > 3 ? (
              <h1 className="h-full">
                <div className="loading loading-spinner loading-md"></div>
              </h1>
            ) : (
              results.map((e, i) => (
                <h1
                  className={
                    "bg-base-300 p-4 rounded-lg border-4 border-base-300 transition ease-in  "
                  }
                  onClick={() => {
                    setSelection(i);
                  }}
                >
                  {e.pair.name}
                </h1>
              ))
            )}
          </div>
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
