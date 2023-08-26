import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { question, authkey } = req.body;

    if (!question || !authkey) {
      return res
        .status(400)
        .json({ error: "Both question and authkey are required." });
    }

    const apiUrl = "https://app.freedomgpt.com/api/liberty";

    const headers = {
      Authorization: `Bearer ${authkey}`,
    };

    const response = await axios.post(apiUrl, { question }, { headers });
    console.log(response.data);

    return res.status(response.status).json({
      answer: response.data.output,
    });
  } catch (error: any) {
    console.error("Error making API request:");
    return res
      .status(error?.response?.status || 500)
      .json({ error: "An error occurred." });
  }
}
