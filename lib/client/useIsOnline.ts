import { useEffect, useState } from "react";
import ClientAPI from "./ClientAPI";
import useInterval from "./useInterval";
import { forceOfflineMode } from "./ClientUtils";

const api = new ClientAPI("gearboxiscool");

export default function useIsOnline() {
  const [isOnline, setIsOnline] = useState(true);

  function updateOnlineStatus() {
    // Don't check if we just checked, even if it was in another useIsOnline hook
    const lastIsOnlineCheck = localStorage.getItem("lastIsOnlineCheck");
    if (lastIsOnlineCheck && Date.now() - parseInt(lastIsOnlineCheck) < 5000) {
      return;
    }

    api.ping()
      .then(() => setIsOnline(true))
      .catch(() => setIsOnline(false));

    localStorage.setItem("lastIsOnlineCheck", Date.now().toString());
  }

  useEffect(() => {
    updateOnlineStatus();
  }, []);
  useInterval(updateOnlineStatus, 5000);

  return isOnline && !forceOfflineMode();
}