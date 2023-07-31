import BaseResponseModel from "./BaseResponseModel";

interface AddJobResponseModel extends BaseResponseModel {
  jobID?: number | string;
}

export default AddJobResponseModel;
