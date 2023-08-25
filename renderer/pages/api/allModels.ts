import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const response = await axios.get("http://localhost:3000/api/models");
    const pluginsData = response.data;

    const plugins = pluginsData.map((data: any) => ({
      id: data.id,
      name: data.model,
      config: {
        model: data.model,
        downloadURL: data.downloadURL,
        requiredRAM: Number(data.requiredRAM),
        fileSize: Number(data.fileSize),
        description: data.description,
        id: data.id,
      },
    }));

    res.status(200).json(plugins);
  } catch (error) {
    console.error("Error fetching plugins:", error);
    res.status(500).json({ error: "Error fetching plugins" });
  }
};
