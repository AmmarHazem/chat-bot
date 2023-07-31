import { RequestHandler } from "express";
import encrypt from "../utils/encrypt";
import hubspotQueue from "../utils/hubspot-queue";
import HubspotJobModel from "../models/HubspotJobModel";
import GetPendingJobsFromConversationReqModel from "../models/GetPendingJobsFromConversationReqModel";
import RemoveJobsFromQueueReqBodyModel from "../models/RemoveJobsFromQueueReqBodyModel";

export const removeJobsFromQueue: RequestHandler<{}, string, RemoveJobsFromQueueReqBodyModel> = async (req, res) => {
  try {
    await Promise.all(
      req.body.jobIDs.map((id) => {
        return hubspotQueue.removeJobs(id);
      })
    );
    res.status(200).json(encrypt({ success: 1 }));
  } catch (error) {
    console.log("--- removeJobsFromQueue error", error);
    res.status(400).json(encrypt({ success: 0 }));
  }
};

export const getPendingJobsFromConversation: RequestHandler<{}, string, GetPendingJobsFromConversationReqModel> = async (
  req,
  res
) => {
  try {
    const jobsFromQueue = await hubspotQueue.getJobs(["delayed", "waiting", "paused"]);
    const pendingJobsFromSameConversation = jobsFromQueue.filter((job) => {
      return (
        job.data.webhookMessage.objectId.toString() === req.body.conversationID.toString() &&
        job.data.webhookMessage.messageId !== req.body.messageIDToExclude
      );
    });
    res.json(encrypt({ success: 1, jobs: pendingJobsFromSameConversation }));
  } catch (error) {
    console.log("--- getPendingJobsFromConversation", error);
    res.status(400).json(encrypt({ success: 0 }));
  }
};

export const addJobToQueue: RequestHandler<{}, string, HubspotJobModel> = async (req, res) => {
  try {
    const job = await hubspotQueue.add(req.body);
    res.status(200).json(encrypt({ success: 1, jobID: job.id }));
  } catch (error) {
    console.log("--- addJobToQueue error", error);
    res.status(400).json(encrypt({ success: 0 }));
  }
};

export const hubspotWebhook: RequestHandler = async (req, res) => {
  res.send("hubspotWebhook");
};
