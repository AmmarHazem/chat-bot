interface HubspotWebhookEventModel {
  eventId: number;
  subscriptionId: number;
  portalId: number;
  appId: number;
  occurredAt: number;
  subscriptionType: string;
  attemptNumber: number;
  objectId: number;
  messageId: string;
  messageType: string; // "MESSAGE";
  changeFlag: string; // "NEW_MESSAGE";
}

export default HubspotWebhookEventModel;
