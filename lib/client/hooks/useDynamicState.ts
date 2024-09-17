import { Dispatch, MutableRefObject, SetStateAction, useRef, useState } from "react";

/**
 * An alternative to useState that allows for the latest state to be easily retrieved.
 * 
 * @param initialState
 * @returns [ state, setState, getState ]. The first two elements are the same as useState, and the
 *  third element is a function that takes a function as a parameter. The parameter function takes the latest state as
 *  a parameter.
 */
export default function<T>(initialState?: T): 
    [T | undefined, Dispatch<SetStateAction<T | undefined>>, (func: (state: T | undefined) => any) => any, MutableRefObject<T | undefined>] {
  const [state, setState] = useState<T | undefined>(initialState);
  const latestState = useRef<T | undefined>(initialState);

  return [
    state,
    (newState) => {
      setState(newState);
      if (typeof newState === "function")
        latestState.current = (newState as ((prevState: T | undefined) => T | undefined))(latestState.current);
      else
        latestState.current = newState;
    },
    (func: (state: T | undefined) => any) => {
      return func(latestState.current);
    },
    latestState
  ]
}