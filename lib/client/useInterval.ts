import { useCallback, useEffect, useState } from "react";

/**
 * Can be janky. You've been warned.
 */

export default function useInterval(
	func: () => any,
	interval: number,
	deps: any[] = [],
) {
	const [id, setId] = useState<NodeJS.Timeout>();
	const callback = useCallback(func, [func, ...deps]);

	useEffect(() => {
		console.log("Setting interval", interval);
		const newInterval = setInterval(callback, interval);
		setId(newInterval);
		return () => clearInterval(newInterval);
	}, [interval, callback]);

	return id;
}
