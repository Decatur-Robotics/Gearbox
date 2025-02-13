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
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const callback = useCallback(func, [func.name]);

	useEffect(() => {
		setId(setInterval(callback, interval));
		return () => clearInterval(id);
		// ESLint doesn't like spread operator in dependencies
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [interval, callback, id, ...deps]);

	return id;
}
