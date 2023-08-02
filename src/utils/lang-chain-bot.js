import sendEmail from "./send-email";
import { loadQAStuffChain } from "langchain/chains";
import { FirestoreChatMessageHistory } from "langchain/stores/message/firestore";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferWindowMemory, BufferMemory } from "langchain/memory";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PromptTemplate } from "langchain/prompts";
import { PineconeClient } from "@pinecone-database/pinecone";
import { Document } from "langchain/document";

const indexName = "dardoc";
const openAIAPIKey = process.env.OPEN_AI_API_KEY;

let client; // PineconeClient | undefined;
async function getPineconeClient() {
  if (client) return client;
  const newClient = new PineconeClient();
  await newClient.init({
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINE_CONE_ENVIRONMENT ?? "",
  });
  client = newClient;
  return newClient;
}

function getMemory({ conversationID, userID }) {
  // const now = moment();
  // const sessionTime = now.subtract(now.get("minute") % 10, "minute");
  const sessionID = `${conversationID}`; // `${conversationID}-${sessionTime.format()}`;
  console.log("--- memory session id", sessionID);
  const memory = new BufferWindowMemory({
    chatHistory: new FirestoreChatMessageHistory({
      collectionName: "dardoc_open",
      sessionId: sessionID,
      userId: userID,
      config: { projectId: "dardoc-openai" },
    }),
    memoryKey: "chat_history",
    inputKey: "question",
    outputKey: "text",
    returnMessages: false,
    k: 4,
  });
  return memory;
}

export const conversationalRetrieval = async ({ question, conversationID, userID }) => {
  if (!question.trim()) return "";
  try {
    const promptTemplate = `Your name is Sara. You are a sales driven customer agent at DarDoc. As an agent, your role is to assist users and their inquiries regarding DarDoc's services. To do this, you will receive input as a question from a customer {question}. Answer as how a customer support agent would reply. Your responses should be very human like, and not exceeding 300 characters in count. If you do not have adequate information from the context, strictly respond as "Please give me a few minutes to fetch more information on this. We request you to stay connected with us."
    {context}
    You must never ask the customers to reach out to the customer support team or message us. They consider you as the customer support and you are at the front line facing DarDoc. You are communicating to them through our different messaging platforms.
    "`;
    const memory = getMemory({ conversationID, userID });
    const prompt = PromptTemplate.fromTemplate(promptTemplate);
    console.log("Querying PineCone Vector Store...");
    const pineconeClient = await getPineconeClient();
    const index = pineconeClient.Index(indexName);
    const queryEmbedding = await new OpenAIEmbeddings({ openAIApiKey: openAIAPIKey }).embedQuery(question);
    let queryResponse = await index.query({
      queryRequest: {
        topK: 10,
        vector: queryEmbedding,
        includeMetadata: true,
        includeValues: true,
      },
    });
    const concatenatedPageContent = queryResponse.matches?.map((match) => match.metadata?.pageContent).join(".") ?? "";
    let mainDocs = [new Document({ pageContent: concatenatedPageContent })];
    let pineconeVectorStore = await HNSWLib.fromDocuments(mainDocs, new OpenAIEmbeddings({ openAIApiKey: openAIAPIKey }));
    /* Initialize the LLM to use to answer the question */
    const gpt4 = new ChatOpenAI({ temperature: 0.2, modelName: "gpt-4", openAIApiKey: openAIAPIKey });
    const turbo = new ChatOpenAI({ temperature: 0.2, modelName: "gpt-3.5-turbo", openAIApiKey: openAIAPIKey });
    const chain = ConversationalRetrievalQAChain.fromLLM(turbo, pineconeVectorStore.asRetriever(), {
      memory: memory,
      combineDocumentsChain: loadQAStuffChain(gpt4, { prompt: prompt }),
      questionGeneratorChainOptions: {
        llm: gpt4,
      },
    });
    /* Ask it a question */
    console.log("--- chain.call");
    const res = await chain.call({ question });
    if (true) {
      // process.env.mode !== "PROD"
      console.log("=====");
      console.log("Q:", question);
      console.log();
      console.log("A:", res.text);
      console.log("=====");
    }
    return res.text;
  } catch (e) {
    console.log("--- conversationalRetrieval error", e);
    await sendEmail({
      to: ["ammar.hazem@dardoc.com"],
      subject: "Failed to generate reply from LLM",
      html: `<div>
      <div>question: ${question}</div>
      <div>conversationID: ${conversationID}</div>
      <div>userID: ${userID}</div>
      <code>${e}</code>
      </div>`,
    });
    return null;
  }
};

// conversationalRetrieval({
//   conversationID: "lkadsfgjhkafsdhgpqweorj",
//   question: `hi`,
//   userID: "92834u5ry2itu3rhgiru4b",
// });

// export default conversationalRetrieval;
