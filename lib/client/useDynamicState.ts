import { Dispatch, SetStateAction, useState } from "react";

/**
 * An alternative to useState that allows for the latest state to be easily retrieved.
 *
 * @param initialState
 * @returns [ state, setState, getState ]. The first two elements are the same as useState, and the
 *  third element is a function that takes a function as a parameter. The parameter function takes the latest state as
 *  a parameter.
 * @todo Rework this! The forced undefined return type and the forced callback makes me want to barf.
 */
export default function <T>(
	initialState?: T,
): [
	T | undefined,
	Dispatch<SetStateAction<T | undefined>>,
	(func: (state: T | undefined) => void) => void,
] {
	const [state, setState] = useState<T | undefined>(initialState);

	return [
		state,
		setState,
		(func: (state: T | undefined) => void) => {
			setState((prevState) => {
				func(prevState);
				return prevState;
			});
		},
	];
}
