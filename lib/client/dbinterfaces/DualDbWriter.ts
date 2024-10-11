import { useState, useEffect } from "react";
import MiniMongoInterface from "./MiniMongoInterface";
import { MultiDbInterface } from "./MultiDbInterface";
import ApiDbInterface from "./ApiDbInterface";
import { useDbInterface } from "./DbInterface";


/**
 * A DbInterface that writes to LocalStorage and the server DB (through the API).
 * 
 * NOTE: This class has read methods, do not use them! They will throw errors! 
 * Those methods only exist because I haven't found a way to remove them.
 */
export default class DualDbWriter extends MultiDbInterface {
  constructor() {
    super([
      new MiniMongoInterface(),
      new ApiDbInterface()
    ]);
  }
}

export function useDualDbWriter() {
  return useDbInterface(new DualDbWriter());
}