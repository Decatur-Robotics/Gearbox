import { useEffect, useState } from "react";
import ClientAPI from "./ClientAPI";
import useInterval from "./useInterval";
import { forceOfflineMode } from "./ClientUtils";

const api = new ClientAPI("gearboxiscool");

export default function useIsOnline() {
  const [isOnline, setIsOnline] = useState(true);

  async function updateOnlineStatus() {
    // Don't check if we just checked, even if it was in another useIsOnline hook
    const lastIsOnlineCheck = localStorage.getItem("lastIsOnlineCheckTime");
    if (lastIsOnlineCheck && Date.now() - parseInt(lastIsOnlineCheck) < 5000) {
      return localStorage.getItem("lastIsOnlineCheckResult") == "true";
    }

    let online = false;
    await api.ping()
      .then(() => online = true)
      .catch(() => {});

    setIsOnline(online);
    localStorage.setItem("lastIsOnlineCheckTime", Date.now().toString());
    localStorage.setItem("lastIsOnlineCheckResult", Date.now().toString());
  }

  useEffect(() => {
    updateOnlineStatus();
  }, []);
  useInterval(updateOnlineStatus, 5000);

  return isOnline && !forceOfflineMode();
}