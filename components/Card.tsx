import { ReactNode } from "react";

export type CardProps = {title: string | undefined, className: string | undefined, children: ReactNode};
export default function Card(props: CardProps) {
  const title = props.title;
  const className = props.className;
  const children = props.children

  return <div className={`card bg-base-200 shadow-xl w-1/2 max-sm:w-5/6 ${className}`}>
    <div className="card-body">
      {title ? <h1 className="card-title text-3xl font-semibold">{title}</h1> : <></>}
      {children}
    </div>
  </div>
}