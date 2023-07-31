import Bull from "bull";
import HubspotJobModel from "./HubspotJobModel";
import BaseResponseModel from "./BaseResponseModel";

interface GetPendingJobsFromConversationResModel extends BaseResponseModel {
  jobs?: Bull.Job<HubspotJobModel>[];
}

export default GetPendingJobsFromConversationResModel;
