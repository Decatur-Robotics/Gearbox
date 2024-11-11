import Card from "@/components/Card";
import Container from "@/components/Container";
import { useEffect, useState } from "react";

export default function UserAnalytics() {
  const [signInDates, setSignInDates] = useState<{ [team: string]: { [date: string]: number } }>();
  const [minimumUsersToBeActive, setMinimumUsersToBeActive] = useState<number>(3);
  const [maxDaysSinceSignInToBeActive, setMaxDaysSinceSignInToBeActive] = useState<number>(14);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
  }, []);

  return (
    <Container requireAuthentication={true} title="User Analytics">
      {
        errorMessage
          ? <div className="w-full h-full flex items-center justify-center">
              <Card title={errorMessage}>
                If this is a mistake, add your email to DEVELOPER_EMAILS in the .env
              </Card>
            </div>
          : <div>
            <h1 className="text-4xl">User Analytics</h1>
            <div className="flex flex-row">
              <div className="flex flex-col">
                <div className="flex flex-row items-center gap-2">
                  <div className="text-2xl">Active Threshold:</div>
                  <input 
                    className="input input-bordered w-1/4" 
                    type="number" 
                    value={maxDaysSinceSignInToBeActive} 
                    onChange={(e) => setMaxDaysSinceSignInToBeActive(Math.max(+e.target.value, 0))} 
                  />
                </div>
                <p className="text-sm w-1/2">
                  How recently does a user have to sign in to count as active?
                </p>
              </div>
              <div className="flex flex-col">
                <div className="flex flex-row items-center gap-2">
                  <div className="text-2xl">Users to be Active:</div>
                  <input 
                    className="input input-bordered w-1/4" 
                    type="number" 
                    value={minimumUsersToBeActive} 
                    onChange={(e) => setMinimumUsersToBeActive(Math.max(+e.target.value, 1))} 
                  />
                </div>
                <p className="text-sm w-1/2">
                  How many users makes a team active?
                </p>
              </div>
            </div>
          </div>
      }
    </Container>
  )
}