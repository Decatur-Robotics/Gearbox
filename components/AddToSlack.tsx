export default function AddToSlack() {
  return (
    <a className="link text-accent" href={`
        https://slack.com/oauth/v2/authorize
          ?client_id=${process.env.NEXT_PUBLIC_SLACK_CLIENT_ID}
          &scope=chat:write,commands&user_scope=email,openid
          &redirect_uri=https%3A%2F%2Flocalhost%2Fapi%2FaddSlackBot
    `}>
      Add Gearbox to Slack
    </a>
  );
}