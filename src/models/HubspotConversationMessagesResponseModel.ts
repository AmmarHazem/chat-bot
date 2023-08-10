export interface HubspotConversationMessagesResponseModel {
  results?: HubspotMessageModel[];
  paging?: HubspotPaging;
}

export interface HubspotPaging {
  next?: HubspotNextPage;
}

export interface HubspotNextPage {
  after?: string;
  link?: string;
}

export interface HubspotMessageModel {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  client?: Client;
  senders?: Sender[];
  recipients?: Recipient[];
  archived?: boolean;
  text?: string;
  richText?: string;
  attachments?: any[];
  truncationStatus?: TruncationStatus;
  status?: Status;
  direction?: Direction;
  channelId?: string;
  channelAccountId?: string;
  type?: ResultType;
  conversationsThreadId?: string;
  newStatus?: string;
  assignedTo?: string;
}

export interface Client {
  clientType?: ClientType;
  integrationAppId?: number;
}

export type ClientType = "INTEGRATION" | "SYSTEM" | "HUBSPOT";

export type Direction = "OUTGOING" | "INCOMING";

export interface Recipient {
  actorId?: string;
  recipientField?: RecipientField;
  deliveryIdentifier?: DeliveryIdentifier;
}

export interface DeliveryIdentifier {
  type?: DeliveryIdentifierType;
  value?: string;
}

export type DeliveryIdentifierType = "HS_PHONE_NUMBER";

export type RecipientField = "TO";

export interface Sender {
  actorId?: string;
  deliveryIdentifier?: DeliveryIdentifier;
  name?: Name;
}

export type Name = "Ammar";

export interface Status {
  statusType?: StatusType;
}

export type StatusType = "READ" | "RECEIVED" | "SENT";

export type TruncationStatus = "NOT_TRUNCATED";

export type ResultType = "MESSAGE" | "THREAD_STATUS_CHANGE" | "ASSIGNMENT";
