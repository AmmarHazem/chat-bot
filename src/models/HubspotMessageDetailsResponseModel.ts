export interface HubspotMessageDetailsResponseModel {
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
  truncationStatus?: string;
  status?: Status;
  direction?: string;
  channelId?: string;
  channelAccountId?: string;
  type?: string;
  conversationsThreadId?: string;
}

export interface Client {
  clientType?: string;
  integrationAppId?: number;
}

export interface Recipient {
  actorId?: string;
  recipientField?: string;
  deliveryIdentifier?: DeliveryIdentifier;
}

export interface DeliveryIdentifier {
  type?: string;
  value?: string;
}

export interface Sender {
  actorId?: string;
  deliveryIdentifier?: DeliveryIdentifier;
}

export interface Status {
  statusType?: string;
}
