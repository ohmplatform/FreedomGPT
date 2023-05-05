export type Model = {
  config: {
    FILEPATH: string | null;
    model: string;
    downloadURL: string;
    requiredRAM: number;
    fileSize: number;
    id: string;
  };
};

const models: Model[] = [
  {
    config: {
      FILEPATH: localStorage.getItem("alpaca-7B") || null,
      model: "alpaca-7B-fast",
      downloadURL:
        "https://huggingface.co/bhattaraijay05/Alpaca-7B/resolve/main/ggml-alpaca-7b-q4.bin",
      requiredRAM: 6,
      fileSize: 4,
      id: "alpaca-7B-fast",
    },
  },
  {
    config: {
      FILEPATH: localStorage.getItem("alpaca-7B") || null,
      model: "alpaca-7B-full",
      downloadURL:
        "https://huggingface.co/bhattaraijay05/Alpaca-7B/resolve/main/ggml-alpaca-7b-q4.bin",
      requiredRAM: 6,
      fileSize: 4,
      id: "alpaca-7B-full",
    },
  },
  {
    config: {
      FILEPATH: localStorage.getItem("llama-7B") || null,
      model: "llama-7B-fast",
      downloadURL:
        "https://huggingface.co/bhattaraijay05/llama-7B/resolve/main/ggml-model-q4_0.bin",
      requiredRAM: 6,
      fileSize: 4,
      id: "llama-7B-fast",
    },
  },
  {
    config: {
      FILEPATH: localStorage.getItem("llama-7B") || null,
      model: "llama-7B-full",
      downloadURL:
        "https://huggingface.co/bhattaraijay05/llama-7B/resolve/main/ggml-model-q4_0.bin",
      requiredRAM: 6,
      fileSize: 4,
      id: "llama-7B-full",
    },
  },
];

export default models;
