import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useState } from "react";

// linked icon, for everything with tbaId!!!!!!!
import ClientAPI from "@/lib/client/ClientAPI"
import { GetServerSideProps } from "next";
import { MonthString, TimeString } from "@/lib/client/FormatTime";
import { Match, MatchType } from "@/lib/Types";


const api = new ClientAPI("gearboxiscool");


export default function Home(props: ResolvedUrlData) {}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  }
}