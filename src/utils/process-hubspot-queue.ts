import Bull from "bull";
import HubspotJobModel from "../models/HubspotJobModel";
import hubspotQueue from "./hubspot-queue";
import redisClient from "./redis-client";
import axios from "axios";
import sendEmail from "./send-email";
import HubspotWebhookEventModel from "../models/HubspotWebhookEventModel";
import { HubspotConversationMessagesResponseModel } from "../models/HubspotConversationMessagesResponseModel";
import { HubspotMessageDetailsResponseModel } from "../models/HubspotMessageDetailsResponseModel";
import { conversationalRetrieval } from "./lang-chain-bot";

const ifEnvProd = process.env.mode === "PROD";

async function processHubspotQueue(job: Bull.Job<HubspotJobModel>) {
  console.log("+++ processHubspotQueue");
  const { webhookMessage, accessToken } = job.data;
  const replyToHubspotMessageResponse = await generateReplyToHubspotMessage(webhookMessage, accessToken);
  if (!replyToHubspotMessageResponse) {
    return { success: 1 };
  }
  const { text: messageReply, messageDetails } = replyToHubspotMessageResponse;
  const jobsFromQueue = await hubspotQueue.getJobs(["delayed", "waiting", "paused"]);
  const pendingJobsFromSameConversation = jobsFromQueue
    .filter((job) => {
      return (
        job.data.webhookMessage.objectId === webhookMessage.objectId &&
        job.data.webhookMessage.messageId !== webhookMessage.messageId
      );
    })
    .map<{ data: HubspotJobModel; id?: number | string }>((job) => ({ data: job.data, id: job.id }));
  if (pendingJobsFromSameConversation.length) {
    pendingJobsFromSameConversation.push({ data: { webhookMessage: webhookMessage, accessToken: accessToken } });
    return handleReplyToMessagesGroup({
      accessToken: accessToken,
      queueJobs: pendingJobsFromSameConversation.reverse(),
    });
  } else {
    await redisClient.set(webhookMessage.messageId, "true");
    return sendHubspotMessage({
      messageToReplyTo: messageDetails,
      channelID: messageDetails.channelId ?? "",
      recipientActorID: messageDetails.senders?.[0].actorId ?? "",
      accessToken: accessToken,
      channelAccountID: messageDetails.channelAccountId ?? "",
      conversationID: webhookMessage.objectId.toString(),
      text: messageReply,
    });
  }
}

async function handleReplyToMessagesGroup({
  queueJobs,
  accessToken,
}: {
  queueJobs: { data: HubspotJobModel; id?: number | string }[];
  accessToken: string;
}) {
  const messages = queueJobs.map((job) => job.data.webhookMessage);
  const promisesResults = await Promise.all([
    checkIfShouldStopReplyingToConversationFromRedis(messages[0].objectId),
    checkIfShouldStopReplyingToConversationFromHubspot({
      accessToken: accessToken,
      conversationID: messages[0].objectId,
    }),
    Promise.all(messages.map((msg) => checkIfAlreadyRepliedToMessage(msg.messageId))),
    Promise.all(queueJobs.filter((job) => !!job.id).map((job) => hubspotQueue.removeJobs(job.id!.toString()))),
  ]);
  const stopReplyingToConversationFromRedis = promisesResults[0];
  const stopReplyingToConversationFromHubspot = promisesResults[1];
  if (stopReplyingToConversationFromRedis || stopReplyingToConversationFromHubspot) {
    return null;
  }
  const messagesAlreadyRepliedToArray = promisesResults[2];
  const filteredMessages = messages.filter((msg, i) => {
    if (msg.changeFlag !== "NEW_MESSAGE" || msg.subscriptionType !== "conversation.newMessage") {
      return false;
    } else if (messagesAlreadyRepliedToArray[i]) {
      return false;
    }
    return true;
  });
  if (!filteredMessages.length) {
    return null;
  }
  const messagesDetails = await Promise.all(
    filteredMessages.map((msg) => {
      return getHubspotMessageDetails({
        accessToken: accessToken,
        conversationID: msg.objectId,
        messageID: msg.messageId,
      });
    })
  );
  const filteredMessagesDetailsArray = messagesDetails
    .filter((messageDetails) => {
      if (!messageDetails) {
        return false;
      }
      if (messageDetails?.client?.clientType === "INTEGRATION" || messageDetails?.direction === "OUTGOING") {
        return false;
      }
      if (messageDetails.text === "Get Started") {
        return false;
      }
      return true;
    })
    .map<HubspotMessageDetailsResponseModel>((msg) => msg!);
  if (!filteredMessagesDetailsArray.length) {
    return null;
  }
  const messageText = filteredMessagesDetailsArray.map((msg) => msg.text).join("\n");
  const pinecodeResponse = await conversationalRetrieval({
    question: messageText,
    conversationID: messages[0].objectId.toString(),
    userID: filteredMessagesDetailsArray[0].senders?.[0].actorId ?? "",
  });
  let textMessageResponse = "";
  if (pinecodeResponse?.startsWith('"') && pinecodeResponse?.endsWith('"')) {
    textMessageResponse = pinecodeResponse.substr(1, pinecodeResponse.length - 1);
  } else {
    textMessageResponse = pinecodeResponse;
  }
  await Promise.all(filteredMessagesDetailsArray.map((msg) => redisClient.set(msg.id ?? "", "true")));
  // return { text: textMessageResponse, messageDetails };
  const messageDetails = filteredMessagesDetailsArray[0];
  return sendHubspotMessage({
    messageToReplyTo: messageDetails,
    accessToken: accessToken,
    channelAccountID: messageDetails.channelAccountId ?? "",
    channelID: messageDetails.channelId ?? "",
    conversationID: messages[0].objectId.toString(),
    recipientActorID: messageDetails.senders?.[0].actorId ?? "",
    text: textMessageResponse,
  });
}

async function getHubspotMessageDetails({
  conversationID,
  messageID,
  accessToken,
}: {
  conversationID: number;
  messageID: string;
  accessToken: string;
}): Promise<HubspotMessageDetailsResponseModel | null> {
  try {
    const messageResponse = await axios.get<HubspotMessageDetailsResponseModel>(
      `https://api.hubapi.com/conversations/v3/conversations/threads/${conversationID}/messages/${messageID}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return messageResponse.data;
  } catch (e) {
    console.log("--- getHubspotMessageDetails error", e);
    return null;
  }
}

async function checkIfAlreadyRepliedToMessage(messageID: string) {
  const messageIDFromRedis = await redisClient.get(messageID);
  return !!messageIDFromRedis;
}

async function checkIfShouldStopReplyingToConversationFromRedis(conversationID: number) {
  const stopReplyingToConversationRedisKey = `stop-replying-to-${conversationID}`;
  const stopReplyingToMessageRedis = await redisClient.get(stopReplyingToConversationRedisKey);
  return !!stopReplyingToMessageRedis;
}

async function getHubspotConversation(
  conversationID: number,
  accessToken: string
): Promise<HubspotConversationMessagesResponseModel | null> {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const res = await axios.get<HubspotConversationMessagesResponseModel>(
      `https://api.hubapi.com/conversations/v3/conversations/threads/${conversationID}/messages`,
      {
        headers: headers,
      }
    );
    return res.data;
  } catch (e) {
    console.log("--- getHubspotConversation error", e);
    await sendEmail({
      html: `
      <div>Failed to get conversation from Hubspot</div>
      <code>${e}</code>
      `,
      subject: 'Failed to get conversation from Hubspot',
      to: ['ammar.hazem@dardoc.com']
    })
    return null;
  }
}

const namesToStopTheBotFromReplying = ["argen", "nouf", "dima", "keswin", "adi", "aditya", "ammar"];

async function checkIfShouldStopReplyingToConversationFromHubspot({
  conversationID,
  accessToken,
}: {
  conversationID: number;
  accessToken: string;
}) {
  const conversation = await getHubspotConversation(conversationID, accessToken);
  if (!conversation) {
    console.log('--- failed to get conversation from hubspot')
  }
  const stopReplyingToConversation = conversation?.results?.some((msg) => {
    // console.log('--- stop ', msg?.client?.clientType, msg?.status?.statusType, msg?.direction)
    if (msg?.client?.clientType === "HUBSPOT" && msg?.direction === "OUTGOING") {
      const messageText = msg.text?.toLowerCase() ?? "";
      let stopReplying = false;
      for (const name of namesToStopTheBotFromReplying) {
        console.log('--- msg text', messageText)
        if (messageText.includes(name)) {
          stopReplying = true;
        }
      }
      return stopReplying;
    }
    return false;
  });
  if (stopReplyingToConversation) {
    await setStopReplyingToConversationInRedis({ conversationID: conversationID.toString() });
  }
  return stopReplyingToConversation;
}

function setStopReplyingToConversationInRedis({ conversationID }: { conversationID: string }) {
  const stopReplyingToConversationRedisKey = `stop-replying-to-${conversationID}`;
  return redisClient.set(stopReplyingToConversationRedisKey, "true");
}

// async function checkIfShouldStopReplyingToHubspotMessageDetails(msg: HubspotMessageDetailsResponseModel): Promise<boolean> {
//   const msgText = msg.text?.toLocaleLowerCase();
//   let stopReplying = false;
//   for (const name of namesToStopTheBotFromReplying) {
//     if (msgText?.includes(name)) {
//       stopReplying = true;
//       await setStopReplyingToConversationInRedis({ conversationID: msg.conversationsThreadId ?? '' })
//     }
//   }
//   return stopReplying;
// }

async function generateReplyToHubspotMessage(message: HubspotWebhookEventModel, accessToken: string) {
  try {
    if (message.changeFlag !== "NEW_MESSAGE" || message.subscriptionType !== "conversation.newMessage") {
      return null;
    }
    const redisPromisesResult = await Promise.all([
      checkIfAlreadyRepliedToMessage(message.messageId),
      checkIfShouldStopReplyingToConversationFromRedis(message.objectId),
    ]);
    const messageExistsInRedis = redisPromisesResult[0];
    const stopReplyingToConversationFromRedis = redisPromisesResult[1];
    console.log("--- stopReplyingToConversationFromRedis", stopReplyingToConversationFromRedis);
    if (stopReplyingToConversationFromRedis) {
      return null;
    }
    if (messageExistsInRedis) {
      // console.log("--- already replied");
      return null;
    }
    const stopReplyingToConversationFromHubspot = await checkIfShouldStopReplyingToConversationFromHubspot({
      accessToken: accessToken,
      conversationID: message.objectId,
    });
    console.log("--- stopReplyingToConversationFromHubspot", stopReplyingToConversationFromHubspot);
    if (stopReplyingToConversationFromHubspot) {
      return null;
    }
    const messageDetails = await getHubspotMessageDetails({
      accessToken: accessToken,
      conversationID: message.objectId,
      messageID: message.messageId,
    });
    if (!messageDetails) {
      // console.log("--- error no message details");
      return null;
    }
    if (messageDetails?.client?.clientType === "INTEGRATION" || messageDetails?.direction === "OUTGOING") {
      return null;
    }
    if (messageDetails.text === "Get Started") {
      return null;
    }
    const pinecodeResponse = await conversationalRetrieval({
      conversationID: message.objectId.toString(),
      question: messageDetails.text ?? "",
      userID: messageDetails.senders?.[0].actorId ?? "",
    });
    if (!pinecodeResponse) {
      await sendEmail({
        subject: "No response from LLM",
        to: ["ammar.hazem@dardoc.com"],
        html: `<div>
          <div>LLM faild to generate response</div>
          <p>${messageDetails.text}</p>
          </div>`,
      });
      return null;
    }
    let textMessageResponse = "";
    if (pinecodeResponse.startsWith('"') && pinecodeResponse.endsWith('"')) {
      textMessageResponse = pinecodeResponse.substr(1, pinecodeResponse.length - 1);
    } else {
      textMessageResponse = pinecodeResponse;
    }
    return { text: textMessageResponse, messageDetails };
  } catch (e) {
    console.log("--- replyToHubspotMessage error", e);
    await sendEmail({
      to: ["ammar.hazem@dardoc.com"],
      subject: "Error generating response for Hubspot message",
      html: `<div>
        <div>Error generating response for Hubspot message</div>
        <code>${e}</code>
        </div>`,
    });
    return null;
  }
}

const messageToStopTheBotFromReplying = 'Please give me a few minutes to fetch more information on this. We request you to stay connected with us'.toLocaleLowerCase();

const messageSenderActorID = 'A-50843464';

async function sendHubspotMessage({
  messageToReplyTo,
  conversationID,
  text,
  channelID,
  channelAccountID,
  recipientActorID,
  accessToken,
}: {
  messageToReplyTo?: HubspotMessageDetailsResponseModel;
  conversationID: string;
  text: string;
  channelID: string;
  channelAccountID: string;
  recipientActorID: string;
  accessToken: string;
}) {
  try {
    // console.log('--- ifEnvProd', ifEnvProd)
    if (ifEnvProd) {
      if (text.toLocaleLowerCase().includes(messageToStopTheBotFromReplying)) {
        await setStopReplyingToConversationInRedis({ conversationID: conversationID });
      }
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };
      const sendMessageResponse = await axios.post(
        `https://api.hubapi.com/conversations/v3/conversations/threads/${conversationID}/messages`,
        {
          type: "MESSAGE",
          senderActorId: messageSenderActorID,
          text: text,
          richText: `<div>${text}</div>`,
          channelId: channelID,
          channelAccountId: channelAccountID,
          subject: "DarDoc Customer Care",
          recipients: [
            {
              actorId: recipientActorID,
              recipientField: "TO",
              deliveryIdentifiers: messageToReplyTo?.senders?.length && [messageToReplyTo?.senders[0].deliveryIdentifier],
            },
          ],
        },
        { headers: headers }
      );
      return { success: sendMessageResponse?.data?.id ? 1 : 0 };
    }
    return { success: 1 };
  } catch (e) {
    console.log("--- send hubspot message error", e);
    await sendEmail({
      subject: "Hubport Reply Error",
      to: ["ammar.hazem@dardoc.com"],
      html: `<div>
      <div>Error sending Hubspot reply</div>
      <code>${e}</code>
      </div>`,
    });
    return { success: 0 };
  }
}

export default processHubspotQueue;
