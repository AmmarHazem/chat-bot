import { RequestHandler } from "express";
import decrypt from "../utils/decrypt";

const isProdEnv = process.env.mode === "PROD";

const decryptionMiddleware: RequestHandler = async (req, res, next) => {
  if (isProdEnv && req?.body?.data) {
    req.body = decrypt(req.body.data);
  } else {
    next();
  }
};

export default decryptionMiddleware;
