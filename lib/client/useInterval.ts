import { useCallback, useEffect, useState } from "react";

/**
 * Can be janky. You've been warned.
 */

export default function useInterval(
	func: () => any,
	interval: number,
	deps: any[] = [],
) {
	const [id, setId] = useState<NodeJS.Timeout | undefined>(undefined);
	const callback = useCallback(func, [func.name])

	useEffect(() => {
		setId(setInterval(callback, interval));
		return () => clearInterval(id);
	}, [interval, callback, id, ...deps]);

	return id;
}
