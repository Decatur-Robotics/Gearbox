export default class SlackClient {
  async sendMsg(webhookUrl: string, msg: string) {
    fetch(webhookUrl, {
      method: "POST",
      body: JSON.stringify({ text: msg }),
    })
  }
}