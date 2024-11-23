import { useState } from "react";
import Modal, { hideModal, showModal } from "./Modal";
import ClientApi from "@/lib/api/ClientApi";

const SLACK_WEBHOOK_INSTALL_URL = "https://my.slack.com/services/new/incoming-webhook/";

const api = new ClientApi();

function AddToSlackModal({ teamId }: { teamId: string }) {
  const [webhookUrl, setWebhookUrl] = useState<string>();
  const [errorMsg, setErrorMsg] = useState<string>("");

  function save() {
    if (!webhookUrl) {
      setErrorMsg("Webhook URL is required");
      return;
    }

    api.setSlackWebhook(teamId, webhookUrl)
      .catch((err) => setErrorMsg(err.message))
      .then(() => hideModal("add-to-slack"));
  }

  return (
    <Modal id="add-to-slack" showCloseButton={false} className="flex flex-col gap-4">
      <h2 className="text-xl">Add Gearbox to Slack</h2>
      <div>
        Install the Incoming Webhooks app here:{" "}
        <a href={SLACK_WEBHOOK_INSTALL_URL} target="_blank" className="link link-accent">{SLACK_WEBHOOK_INSTALL_URL}</a>
      </div>
      <div>
        Enter the Webhook URL here:
        <input 
          value={webhookUrl} 
          onChange={(e) => setWebhookUrl(e.target.value)} 
          type="url" 
          placeholder="Webhook URL" 
          className="input input-bordered ml-2" 
        />
      </div>
      <div className="flex gap-4 w-full justify-end">
        <button className="btn btn-primary" onClick={save}>Save</button>
        <button className="btn" onClick={() => hideModal("add-to-slack")}>Cancel</button>
      </div>
      { errorMsg && <div className="text-red-500">{errorMsg}</div> }
    </Modal>
  );
}

export default function AddToSlack({ edit, teamId }: { edit: boolean, teamId: string }) {
  return (<>
      <button className="btn btn-accent btn-sm" onClick={() => showModal("add-to-slack")}>
        { edit ? "Change Slack Webhook" : "Add Gearbox to Slack" }
      </button>
      <AddToSlackModal teamId={teamId} />
    </>
  );
}