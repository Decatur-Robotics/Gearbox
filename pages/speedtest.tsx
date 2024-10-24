import Container from "@/components/Container";
import ClientAPI from "@/lib/client/ClientAPI";
import { Round } from "@/lib/client/StatsMath";
import { useEffect, useState } from "react";

const api = new ClientAPI("gearboxiscool");

type SpeedTestResponse = { 
  [key: string]: number,
  requestTime: number,
  authTime: number,
  insertTime: number,
  findTime: number,
  updateTime: number,
  deleteTime: number,
  responseTime: number, 
  dbTime: number,
  transmitTime: number,
  totalTime: number
};

const SPEED_TEST_LENGTH = 6000;
const SPEED_TEST_PARALLEL_REQUESTS = 60;

export default function SpeedTest() {
  const [times, setTimes] = useState<SpeedTestResponse>();
  const [resultsCompleted, setResultsCompleted] = useState<number | undefined>(undefined);
  const [trialCountByThread, setTrialCountByThread] = useState<number[]>();

  async function runSpeedTest() {
    setResultsCompleted(undefined);

    const newResults: SpeedTestResponse[] = [];

    const trialCountByThread: number[] = [];

    function onTrialComplete(newTimes: Omit<SpeedTestResponse, "totalTime" | "dbTime" | "transmitTime">, thread: number) {
      newResults.push({
        ...newTimes,
        dbTime: newTimes.authTime + newTimes.insertTime + newTimes.findTime + newTimes.updateTime + newTimes.deleteTime,
        transmitTime: newTimes.responseTime + newTimes.requestTime,
        totalTime: Object.values(newTimes).reduce((acc, time) => acc + time, 0)
      } as SpeedTestResponse);

      setResultsCompleted(newResults.length);

      trialCountByThread[thread]++;
      setTrialCountByThread(trialCountByThread);

      if (newResults.length < SPEED_TEST_LENGTH)
        api.speedTest().then(res => onTrialComplete(res, thread));
    }

    for (let i = 0; i < SPEED_TEST_PARALLEL_REQUESTS; i++) {
      const thread = i; // Break the reference
      trialCountByThread[thread] = 0;
      api.speedTest().then(res => onTrialComplete(res, thread))
    }
    
    while (newResults.length < SPEED_TEST_LENGTH)
      await new Promise(resolve => setTimeout(resolve, 25));

    const avgTimes: typeof times = newResults.reduce((acc, times) => {
      Object.entries(times).forEach(([key, value]) => {
        acc[key] += value;
      });
      return acc;
    }, {
      requestTime: 0,
      authTime: 0,
      insertTime: 0,
      findTime: 0,
      updateTime: 0,
      deleteTime: 0,
      responseTime: 0,
      dbTime: 0,
      transmitTime: 0,
      totalTime: 0
    });

    Object.keys(avgTimes).forEach(key => {
      avgTimes[key] /= newResults.length;
    });

    setTimes(avgTimes);
    setResultsCompleted(undefined);
  }

  useEffect(() => {
    runSpeedTest();
  }, []);

  return (
    <Container requireAuthentication={true} title={"Speed Test"}>
      { resultsCompleted !== undefined && <div className="h-2/3 flex flex-col gap-0">
        {
          trialCountByThread!.map((count, index) => 
            <progress key={index} value={count} max={Math.round(SPEED_TEST_LENGTH / SPEED_TEST_PARALLEL_REQUESTS)} className={`w-full h-[1/${SPEED_TEST_PARALLEL_REQUESTS}]`} />
          )
        }
        </div> }
      {
        times 
          ? (
            <div>
              {Object.entries(times).map(([key, value]) => (
                <div key={key} className={`${key === "dbTime" && "mt-4"}`}>
                  {key}: {Round(value)}ms ({Round(value / times.totalTime * 100)}%)
                </div>
              ))}
            </div>
          )
          : <div>Loading... {resultsCompleted}/{SPEED_TEST_LENGTH} Trials Complete</div>
      }
      <button onClick={runSpeedTest} className="btn btn-primary mt-4">Run Speed Test</button>
    </Container>
  );
}