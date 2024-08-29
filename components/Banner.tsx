import { FaDiscord } from "react-icons/fa";

export default function Banner(props: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="alert rounded-none py-1 sm:py-2 font-semibold alert-info"
    >
      {props.children}
    </div>
  );
}

export function DiscordBanner() {
  return (
    <Banner>
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