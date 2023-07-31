import { RequestHandler } from "express";
import encrypt from "../utils/encrypt";

const isProdEnv = process.env.mode === "PROD";

const encryptionMiddleware: RequestHandler = async (req, res, next) => {};

export default encryptionMiddleware;
