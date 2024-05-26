import { useEffect, useState } from "react";

export default function useInterval(func: () => any, interval: number) {
  const [id, setId] = useState<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    setId(setInterval(func, interval));
    return () => clearInterval(id);
  }, [func.name, interval]);

  return id;
}