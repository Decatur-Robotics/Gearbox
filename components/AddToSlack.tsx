import { useRouter } from "next/router";

export default function AddToSlack() {
  const host = window ? window.location.host : "4026.org";

  return (
    <a className="link text-accent" href={`
        https://slack.com/oauth/v2/authorize
          ?client_id=${process.env.NEXT_PUBLIC_SLACK_CLIENT_ID}
          &scope=chat:write,commands&user_scope=email,openid
          &redirect_uri=https://${host}/api/addSlackBot
    `}>
      Add Gearbox to Slack
    </a>
  );
}