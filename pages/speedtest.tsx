import Container from "@/components/Container";
import ClientAPI from "@/lib/client/ClientAPI";
import { useEffect, useState } from "react";

const api = new ClientAPI("gearboxiscool");

type SpeedTestResponse = { 
  requestTime: number,
  authTime: number,
  insertTime: number,
  findTime: number,
  updateTime: number,
  deleteTime: number,
  responseTime: number, 
};

export default function SpeedTest() {
  const [times, setTimes] = useState<SpeedTestResponse>();

  useEffect(() => {
    api.speedTest().then(setTimes);
  }, []);

  return (
    <Container requireAuthentication={true} title={"Speed Test"}>
      {
        times 
          ? (
            <div>
              {Object.entries(times).map(([key, value]) => (
                <div key={key}>
                  {key}: {value}ms
                </div>
              ))}
              <div>
                Total: {Object.values(times).reduce((a, b) => a + b, 0)}ms
              </div>
            </div>
          )
          : <div>Loading...</div>
      }
    </Container>
  );
}