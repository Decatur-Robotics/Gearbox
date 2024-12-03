export interface SlackInterface {
  sendMsg(webhookUrl: string, msg: string): Promise<any>;
}

export default class SlackClient implements SlackInterface {
  sendMsg(webhookUrl: string, msg: string) {
    return fetch(webhookUrl, {
      method: "POST",
      body: JSON.stringify({ text: msg }),
    })
  }
}