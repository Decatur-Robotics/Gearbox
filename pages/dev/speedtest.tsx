import Container from "@/components/Container";
import ClientApi from "@/lib/api/ClientApi";
import { Round } from "@/lib/client/StatsMath";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import useInterval from "@/lib/client/useInterval";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const api = new ClientApi();

type SpeedTestResponse = {
	[key: string]: number;
	requestTime: number;
	authTime: number;
	insertTime: number;
	findTime: number;
	updateTime: number;
	deleteTime: number;
	responseTime: number;
	dbTime: number;
	transmitTime: number;
	totalTime: number;
};

const SPEED_TEST_LENGTH = 12000;
const SPEED_TEST_PARALLEL_REQUESTS = 120;

export default function SpeedTest() {
	const { session, status } = useCurrentSession();

	const [trialCountByThread, setTrialCountByThread] = useState<number[]>();
	const [results, setResults] = useState<SpeedTestResponse[]>([]);
	const [avgResult, setAvgResult] = useState<SpeedTestResponse>();

	const runSpeedTest = useCallback(async () => {
		if (!session?.user) {
			toast.error("You must be logged in to run a speed test");
			return;
		}

		console.log("Running Speed Test");

		const newResults: SpeedTestResponse[] = [];
		const trialCountByThread: number[] = [];

		function onTrialComplete(
			newTimes: Omit<
				SpeedTestResponse,
				"totalTime" | "dbTime" | "transmitTime"
			>,
			thread: number,
		) {
			delete newTimes.responseTimestamp;

			newResults.push({
				...newTimes,
				dbTime:
					newTimes.authTime +
					newTimes.insertTime +
					newTimes.findTime +
					newTimes.updateTime +
					newTimes.deleteTime,
				transmitTime: newTimes.responseTime + newTimes.requestTime,
				totalTime: Object.values(newTimes).reduce((acc, time) => acc + time, 0),
			} as SpeedTestResponse);

			trialCountByThread[thread]++;
			setTrialCountByThread(trialCountByThread);

			setResults(newResults);

			if (newResults.length < SPEED_TEST_LENGTH)
				api.speedTest().then((res) => onTrialComplete(res, thread));
		}

		for (let i = 0; i < SPEED_TEST_PARALLEL_REQUESTS; i++) {
			const thread = i; // Break the reference
			trialCountByThread[thread] = 0;
			api.speedTest().then((res) => onTrialComplete(res, thread));
		}
	}, [session]);

	const updateResults = useCallback(() => {
		if (!results) return;

		const avgTimes: typeof avgResult = results.reduce(
			(acc, times) => {
				Object.entries(times).forEach(([key, value]) => {
					acc[key] += value;
				});
				return acc;
			},
			{
				requestTime: 0,
				authTime: 0,
				insertTime: 0,
				findTime: 0,
				updateTime: 0,
				deleteTime: 0,
				responseTime: 0,
				dbTime: 0,
				transmitTime: 0,
				totalTime: 0,
			},
		);

		Object.keys(avgTimes).forEach((key) => {
			avgTimes[key] /= results.length;
		});

		setAvgResult(avgTimes);
	}, [results]);

	useInterval(updateResults, 1000);

	return (
		<Container
			requireAuthentication={true}
			title={"Speed Test"}
		>
			<div className="flex w-screen h-screen">
				<div>
					{avgResult ? (
						<div>
							<div>
								Results: {results.length}/{SPEED_TEST_LENGTH} Trials Complete
							</div>
							{Object.entries(avgResult).map(([key, value]) => (
								<div
									key={key}
									className={`${key === "dbTime" && "mt-4"}`}
								>
									{key}: {Round(value)}ms (
									{Round((value / avgResult.totalTime) * 100)}
									%)
								</div>
							))}
						</div>
					) : (
						<div>Loading...</div>
					)}
					<button
						onClick={runSpeedTest}
						className={`btn btn-${session?.user ? "primary" : "disabled"} mt-4`}
						disabled={!session?.user}
					>
						Run Speed Test
					</button>
					<div>Auth Status: {status}</div>
				</div>
				{results && trialCountByThread && (
					<div className="h-[70%] w-full flex flex-col gap-0">
						{trialCountByThread!.map((count, index) => (
							<progress
								key={index}
								value={count}
								max={Math.round(
									SPEED_TEST_LENGTH / SPEED_TEST_PARALLEL_REQUESTS,
								)}
								className={`h-[1/${SPEED_TEST_PARALLEL_REQUESTS}]`}
							/>
						))}
					</div>
				)}
			</div>
		</Container>
	);
}
