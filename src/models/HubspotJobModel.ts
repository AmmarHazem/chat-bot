import HubspotWebhookEventModel from "./HubspotWebhookEventModel";

interface HubspotJobModel {
  webhookMessage: HubspotWebhookEventModel;
  accessToken: string;
}

export default HubspotJobModel;
