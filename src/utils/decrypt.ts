import cryptLib from "@skavinvarnan/cryptlib";
import { encryptionKey } from "../constants";

const decrypt = (body: any) => {
  const decryptedString = JSON?.parse(cryptLib.decryptCipherTextWithRandomIV(body, encryptionKey));
  return decryptedString;
};

export default decrypt;
