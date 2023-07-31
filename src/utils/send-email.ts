import mailchimp from "@mailchimp/mailchimp_transactional";
import { mailchimpAPIKey } from "../constants";

const mailchimpTx = mailchimp(mailchimpAPIKey);

async function sendEmail({
  from = "product@dardoc.com",
  subject,
  html,
  to,
}: {
  from?: string;
  subject: string;
  html: string;
  to: string[];
}) {
  const response = await mailchimpTx.messages.send({
    message: {
      from_email: from,
      subject: subject,
      html: html,
      to: to.map((email) => {
        return {
          email: email,
          type: "to",
        };
      }),
    },
  });
  return response;
}

export default sendEmail;
