declare module "lang-chain-bot" {
  export const conversationalRetrieval: (params: {
    question: string;
    conversationID: string;
    userID: string;
  }) => Promise<string | null>;
}
