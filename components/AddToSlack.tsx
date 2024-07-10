export default function AddToSlack() {
  return (
    <a href="https://slack.com/oauth/v2/authorize?client_id=10831824934.7404945710466&scope=chat:write,commands&user_scope=chat:write,email,openid">
      <img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" 
        srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" />
    </a>
  );
}