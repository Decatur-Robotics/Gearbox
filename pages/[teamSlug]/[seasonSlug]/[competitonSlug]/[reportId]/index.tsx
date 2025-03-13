import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Form, { FormProps } from "@/components/forms/Form";
import { GetServerSideProps } from "next";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { games } from "@/lib/games";
import { defaultGameId } from "@/lib/client/GameId";
import { QuantData, Report } from "@/lib/Types";
import { FormLayout } from "@/lib/Layout";
import { makeObjSerializeable } from "@/lib/client/ClientUtils";
import { useEffect } from "react";
import ClientApi from "@/lib/api/ClientApi";

const api = new ClientApi();

export default function Homepage(props: FormProps) {
	useEffect(() => {
		if (props.report)
			setInterval(() => api.checkInForReport(props.report._id!.toString()), 5000);
	}, [props.report]);

	return (
		<Container
			requireAuthentication={true}
			title={`${props.report.robotNumber} | Quant Scouting`}
		>
			{props.report ? <Form {...props} /> : <p className="text-error">Welp.</p>}
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const resolved = await UrlResolver(context, 4);
	if ("redirect" in resolved) {
		return resolved;
	}

	const season = resolved.season;

	return {
		props: {
			report: resolved.report,
			layout: makeObjSerializeable(
				games[season?.gameId ?? defaultGameId].quantitativeReportLayout,
			),
			fieldImagePrefix: games[season?.gameId ?? defaultGameId].fieldImagePrefix,
			teamNumber: resolved.team?.number,
			compName: resolved.competition?.name,
		},
	} as { props: FormProps };
};
