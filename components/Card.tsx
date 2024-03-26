import { ReactNode } from "react";

export type CardProps = {
  title?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
  coloredTop?: "primary" | "secondary" | "accent" | undefined;
};
export default function Card(props: CardProps) {
  const title = props.title;
  const className = props.className;
  const children = props.children;
  const color = props.coloredTop;

  return (
    <div
      className={`card bg-base-200 shadow-xl w-2/3 max-sm:w-5/6 ${className}`}
    >
      {color ? (
        <div
          className={`card-body min-h-1/2 w-full bg-${color} rounded-t-lg`}
        ></div>
      ) : (
        <></>
      )}
      <div className="card-body">
        {title ? (
          <h1 className="card-title text-3xl font-semibold">{title}</h1>
        ) : (
          <></>
        )}
        {children}
      </div>
    </div>
  );
}