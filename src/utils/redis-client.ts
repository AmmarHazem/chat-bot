import { createClient } from "redis";
import { redisURL, redisPassword } from "../constants";

const redisClient = createClient({
  url: redisURL,
  password: redisPassword,
});

redisClient.on("error", (error) => {
  console.log("Redis Client Error", error);
});

async function connectRedisClient() {
  await redisClient.connect();
  const ping = await redisClient.ping();
  console.log("Redis ping", ping);
}

connectRedisClient();

export default redisClient;
