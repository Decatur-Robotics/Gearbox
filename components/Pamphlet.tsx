import { BsGearFill } from "react-icons/bs";

function SheetOfPaper(props: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-black">
      <div className="h-[11in] w-[8.5in]">
        {props.children}
      </div>
    </div>
  );
}

function HalfSheet(props: { children: React.ReactNode }) {
  return (
    <div className="h-[5.5in] w-[8.5in]">
      {props.children}
    </div>
  );
}

/**
 * @param props A pamphlet that takes up a half-sheet of paper
 */
export default function Pamphlet(props: { children: React.ReactNode }) {
  return (
    <SheetOfPaper>
      <HalfSheet>
        {props.children}
      </HalfSheet>
      <HalfSheet>
        {props.children}
      </HalfSheet>
    </SheetOfPaper>
  );
}
