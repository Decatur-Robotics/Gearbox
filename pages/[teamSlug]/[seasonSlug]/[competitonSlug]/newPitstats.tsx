import Container from "@/components/Container";
import BarGraph from "@/components/stats/Graph";
import { Competition, Report } from "@/lib/Types";
import { ResolvedUrlData, SerializeDatabaseObject } from "@/lib/UrlResolver";
import UrlResolver from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { BsGearFill } from "react-icons/bs";

import ClientAPI from "@/lib/client/ClientAPI";
import { useEffect, useState } from "react";
import { Collections, GetDatabase } from "@/lib/MongoDB";
import { NumericalAverage } from "@/lib/client/StatsMath";

const api = new ClientAPI("gearboxiscool");

export default function Pitstats(props: { competition: Competition }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);

  const progress = (currentSlide / slides.length).toFixed(2);

  return (
    <Container hideMenu={true} requireAuthentication={true}>
      <div className="w-full h-screen flex flex-col items-center justify-center bg-base-300">
        <progress
          className="progress progress-success w-56"
          value={progress}
          max="100"
        ></progress>
        <div className="skeleton w-full h-2/3"></div>
      </div>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await GetDatabase();
  const compSlug = context.resolvedUrl.split("/")[3];
  const comp = await db.findObject(Collections.Competitions, {
    slug: compSlug,
  });

  return {
    props: { competition: SerializeDatabaseObject(comp) },
  };
};
