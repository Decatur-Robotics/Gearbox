import { useState } from "react";
import ClientAPI from "./ClientAPI";
import useInterval from "./useInterval";

const api = new ClientAPI("gearboxiscool");

export default function useIsOnline() {
  const [isOnline, setIsOnline] = useState(true);

  function updateOnlineStatus() {
    api.ping()
      .then(() => setIsOnline(true))
      .catch(() => setIsOnline(false));
  }

  updateOnlineStatus();
  useInterval(updateOnlineStatus, 5000);

  return isOnline;
}