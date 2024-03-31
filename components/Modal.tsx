import useLocalStorage from "@/lib/client/useLocalStorage";
import { useEffect, useRef } from "react";
import Flex from "./Flex";

const UPDATEKEY = "gb-updatev0.51";

export function ChangesModal(props: {}) {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const res = localStorage.getItem(UPDATEKEY);
    console.log(res);
    if (modalRef.current && !res) {
      modalRef.current.showModal();
      localStorage.setItem(UPDATEKEY, "true");
    }
  });

  return (
    <div className="">
      <dialog className="modal shadow-lg bg-transparent " ref={modalRef}>
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <Flex center={true}>
            <img src="/art/BrokenRobot.svg" className="w-1/2"></img>
          </Flex>
          <h3 className="font-bold text-lg">Whats New?</h3>
          <p className="py-4">We have been working hard to improve Gearbox</p>
          <div className="divider"></div>
          <p className="font-semibold">
            Changelog:{" "}
            <span className="text-accent">Update #5 (3/29/2024)</span>
          </p>
          <ul className="list-disc w-full text-sm ml-6 mt-2">
            <li>Fixes to Scouter Reassignment</li>
            <li>UI Revamp to have a more continous experience</li>
            <li>Better hosting and infastructure</li>
            <li>Functional XP/Levels</li>
            <li>Better Stat Page Functionality</li>
          </ul>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
