import cryptLib from "@skavinvarnan/cryptlib";
import { encryptionKey } from "../constants";

const encrypt = (body: any) => {
  const secretKey = encryptionKey.substring(0, 32);
  const stringfiedData = JSON.stringify(body);
  const encryptedResult = cryptLib.encryptPlainTextWithRandomIV(stringfiedData, secretKey);
  return encryptedResult;
};

export default encrypt;
