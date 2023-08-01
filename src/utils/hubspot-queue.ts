import { bullQueueRedisHostName, bullQueueRedisPassword, bullQueueRedisPort } from "../constants";
import Bull from "bull";
import HubspotJobModel from "../models/HubspotJobModel";
import processHubspotQueue from "./process-hubspot-queue";

const isProdEnv = process.env.mode === "PROD";

const hubspotQueue = new Bull<HubspotJobModel>("hubspotQueue", {
  redis: isProdEnv
    ? {
      host: bullQueueRedisHostName,
      password: bullQueueRedisPassword,
      port: bullQueueRedisPort,
      // autoResubscribe: true,
      tls: { servername: bullQueueRedisHostName },
    }
    : undefined,
});

hubspotQueue.process(processHubspotQueue);

hubspotQueue.on("ready", () => {
  console.log("hubspotQueue ready");
});

hubspotQueue.on("reconnecting", (error) => {
  console.log("hubspotQueue reconnecting", error);
});

hubspotQueue.on("completed", (job) => {
  console.log(`Job ${job?.id} completed successfully.`);
});

hubspotQueue.on("failed", (job, error) => {
  console.log("--- failed 1", job);
  console.log(error);
});

hubspotQueue.on("error", (error: Error) => {
  console.log("--- failed 2");
  console.log(error);
});

hubspotQueue.on("stalled", (job) => {
  console.warn(`Job ${job?.id} has stalled`);
});

export default hubspotQueue;
