import { useState, useEffect } from "react";

export default function useLocalStorage<Type>(key: string) {
	const [data, setData] = useState<Type>();

	const setCallback = (dataToSet: Type) => {
		setData(data);
		localStorage.setItem(key, JSON.stringify(dataToSet));
	};

	useEffect(() => {
		if (localStorage && key.length > 0) {
			JSON.stringify(localStorage.getItem(key));
		}
	}, [key]);

	return [data as Type, setCallback] as const;
}
