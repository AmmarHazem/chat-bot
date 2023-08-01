import express from "express";
import {
  hubspotWebhook,
  addJobToQueue,
} from "../controllers/hubspot-webhook";

const router = express.Router();

router.post("/", hubspotWebhook);
router.post("/add-job-to-queue", addJobToQueue);
// router.post("/get-pending-jobs-from-conversation", getPendingJobsFromConversation);
// router.post("/remove-jobs-form-queue", removeJobsFromQueue);

export default router;
