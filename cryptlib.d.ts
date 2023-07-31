declare module "@skavinvarnan/cryptlib" {
  export function encrypt(data: string, key: string): string;
  export function encryptPlainTextWithRandomIV(data: string, key: string): string;
  export function decryptCipherTextWithRandomIV(body: string, key: string): string;

  // export const constants: {
  //   ALGORITHM: string;
  //   MODE: string;
  // };
}
