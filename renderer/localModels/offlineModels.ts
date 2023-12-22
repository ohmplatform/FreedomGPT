import { CloudModel } from "@/types/plugin";

export const offlineModels: CloudModel[] = [
  {
    image:
      "https://firebasestorage.googleapis.com/v0/b/freedom-gpt.appspot.com/o/000freedomgpt_models%2F5f112c652762100f2cd30c6ea6282c76.png?alt=media&token=2f83df23-e173-40c1-8f62-149a37c31170&_gl=1*17qwr7d*_ga*MTEzMTE1OTY3LjE2Nzc1MjI4MDE.*_ga_CW55HF8NVT*MTY5OTM4OTM4MC40MjkuMS4xNjk5Mzg5MzkyLjQ4LjAuMA..",
    inputCost: 0,
    outputCost: 0,
    description:
      "Liberty is known for being very direct and unreserved. She answers questions honestly without judging your question. Her capabilities are very similar to ChatGPT 3 without censorship. Because this model runs locally on your computer for best performance we recommend closing other windows and applications while using.",
    hasSettings: true,
    defaultPrompt: "Follow the user's instructions carefully.",
    isNew: false,
    type: ["text"],
    enabled: false,
    hasInfiniteMode: true,
    tags: ["all", "Uncensored"],
    createdAt: { seconds: 1693147143, nanoseconds: 455000000 },
    endpoint: "edge",
    defaultSummaryPrompt:
      "You are an expert in summarizing chat transcripts.\n      Your goal is to create a summary of the transcript.\n\n      Below you find the transcript of the chat:\n      --------\n      {transcript}\n      --------\n\n      Total output will be a summary of the transcript.",
    fileSize: "8",
    firstMessageCost: 0,
    name: "LIBERTY - EDGE",
    tokenLimit: 4000,
    id: "liberty-edge",
    requiredRAM: "6",
    maxLength: 12000,
    downloadURL:
      "https://huggingface.co/TheBloke/Luna-AI-Llama2-Uncensored-GGUF/resolve/main/luna-ai-llama2-uncensored.Q8_0.gguf",
    model: "liberty-edge",
  },
  {
    image:
      "https://firebasestorage.googleapis.com/v0/b/freedom-gpt.appspot.com/o/000freedomgpt_models%2F5f112c652762100f2cd30c6ea6282c76.png?alt=media&token=2f83df23-e173-40c1-8f62-149a37c31170&_gl=1*17qwr7d*_ga*MTEzMTE1OTY3LjE2Nzc1MjI4MDE.*_ga_CW55HF8NVT*MTY5OTM4OTM4MC40MjkuMS4xNjk5Mzg5MzkyLjQ4LjAuMA..",
    inputCost: 0,
    outputCost: 0,
    description:
      "Use any model you want. This model is a simple wrapper for any model you want to use.",
    hasSettings: true,
    defaultPrompt: "Follow the user's instructions carefully.",
    isNew: false,
    type: ["text"],
    enabled: false,
    hasInfiniteMode: true,
    tags: ["all", "Uncensored"],
    createdAt: { seconds: 1693147143, nanoseconds: 455000000 },
    endpoint: "edge",
    defaultSummaryPrompt:
      "You are an expert in summarizing chat transcripts.\n      Your goal is to create a summary of the transcript.\n\n      Below you find the transcript of the chat:\n      --------\n      {transcript}\n      --------\n\n      Total output will be a summary of the transcript.",
    fileSize: "8",
    firstMessageCost: 0,
    name: "Bring Your Own Model - EDGE",
    tokenLimit: 4000,
    id: "byom-edge",
    requiredRAM: "6",
    maxLength: 12000,
    downloadURL:
      "https://huggingface.co/TheBloke/Luna-AI-Llama2-Uncensored-GGUF/resolve/main/luna-ai-llama2-uncensored.Q8_0.gguf",
    model: "byom",
  },
];
