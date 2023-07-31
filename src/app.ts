import "dotenv/config";
import "./utils/fb-admin";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import HubspotWebhookRouter from "./routes/hubspot-webhook";
import decryptionMiddleware from "./middlewares/decryption-middleware";
import errorHandlerMiddleware from "./middlewares/error-handler-middleware";

const app = express();

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(jsonParser);
app.use(urlencodedParser);
app.use(decryptionMiddleware);
app.use("/api/hubspot-webhook", HubspotWebhookRouter);
app.use(errorHandlerMiddleware);

const port = process.env.SERVER_PORT;

async function start() {
  try {
    console.log("Connecting to DB");
    await mongoose.connect(process.env.MONGO_URL ?? "");
    console.log("Connected to DB");
    app.listen(port, () => {
      console.log(`Listening in port ${port}`);
    });
  } catch (e) {
    console.log("---- start server error", e);
  }
}

start();
