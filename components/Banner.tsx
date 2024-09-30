import { useEffect, useState } from "react";
import { FaDiscord } from "react-icons/fa";

export default function Banner(props: { children: React.ReactNode, id: string }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`banner-dismissed-${props.id}`);
    if (dismissed)
      setDismissed(true);
  }, [props.id]);

  if (dismissed)
    return <></>;

  return (
    <div
      role="alert"
      className="alert rounded-none py-1 sm:py-2 font-semibold alert-info"
    >
      {props.children}
      <button
        onClick={() => {
          localStorage.setItem(`banner-dismissed-${props.id}`, "true");
          setDismissed(true);
        }}
        className="btn btn-sm btn-ghost max-sm:absolute max-sm:right-2 max-sm:top-2"
      >
        X
      </button>
    </div>
  );
}

export function DiscordBanner() {
  return (
    <Banner id="discord">
      <FaDiscord className="max-sm:hidden" size={32} />
      <span className="max-sm:text-sm">Join our Discord for realtime support!</span>
      <a
        href="https://discord.gg/ha7AnqxFDD"
        className="btn btn-primary"
      >
        <FaDiscord size={35} /> Join today
      </a>
    </Banner>
  );
}