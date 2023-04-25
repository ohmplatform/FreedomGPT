import { useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import Loader from "./components/Loader";
import { DownloadProgressContext } from "./context/DownloadContext";
import { useModel } from "./context/ModelSelection";
import Main from "./screens/Main";

const models = [
  {
    config: {
      FILEPATH: localStorage.getItem("alpaca-7B") || null,
      model: "alpaca-7B-fast",
      downloadURL:
        "https://huggingface.co/Sosaka/Alpaca-native-4bit-ggml/resolve/main/ggml-alpaca-7b-q4.bin",
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
        "https://huggingface.co/Sosaka/Alpaca-native-4bit-ggml/resolve/main/ggml-alpaca-7b-q4.bin",
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
        "https://huggingface.co/hlhr202/llama-7B-ggml-int4/resolve/main/ggml-model-q4_0.bin",
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
        "https://huggingface.co/hlhr202/llama-7B-ggml-int4/resolve/main/ggml-model-q4_0.bin",
      requiredRAM: 6,
      fileSize: 4,
      id: "llama-7B-full",
    },
  },
];

const App = ({ socket }: { socket: Socket }) => {
  const { selectedModel, modelLoading, modelLoaded } = useModel();
  const [selectionVisible, setSelectionVisible] = useState(false);

  return (
    <div>
      {!selectedModel && !modelLoading && (
        <div
          style={{
            padding: "30px",
            width: "70%",
            backgroundColor: "black",
            margin: "auto",
            borderRadius: "10px",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {models.map((model, index) => (
            <ModelList
              socket={socket}
              setSelectionVisible={setSelectionVisible}
              model={model}
              key={model.config.id}
              index={index}
            />
          ))}
        </div>
      )}

      {modelLoading && !modelLoaded && <ModelLoading />}

      {selectedModel && (
        <Header
          selectedModel={selectedModel}
          socket={socket}
          selectionVisible={selectionVisible}
          setSelectionVisible={setSelectionVisible}
        />
      )}

      {selectedModel && modelLoaded && <Main {...{ socket }} />}
    </div>
  );
};

export default App;

function Header({
  selectedModel,
  socket,
  selectionVisible,
  setSelectionVisible,
}: {
  selectedModel: string;
  socket: Socket;
  selectionVisible: boolean;
  setSelectionVisible: (arg0: boolean) => void;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: "0.5rem",
        backgroundColor: "black",
      }}
    >
      <div
        style={{
          marginRight: "1rem",
          fontSize: "1.2rem",
        }}
      >
        Selected Model:{" "}
        <span
          style={{
            fontWeight: "bold",
            color: "white",
            cursor: "pointer",
          }}
          onClick={() => setSelectionVisible(!selectionVisible)}
        >
          {selectedModel.split("-").join(" ").toUpperCase()}

          <span
            style={{
              fontSize: "0.8rem",
              marginLeft: "0.5rem",
            }}
          >
            ▼
          </span>
        </span>
      </div>
      {selectionVisible && (
        <>
          <div
            style={{
              padding: "30px",
              width: "70%",
              backgroundColor: "black",
              margin: "auto",
              borderRadius: "10px",
              position: "absolute",
              top: "5vh",
              zIndex: 1001,
            }}
          >
            {models
              .filter((model) => model.config.FILEPATH !== null)
              .map((model, index) => (
                // models.map((model, index) => (
                <ModelList
                  socket={socket}
                  setSelectionVisible={setSelectionVisible}
                  model={model}
                  key={model.config.id}
                  index={index}
                />
              ))}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              <button
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#FF8C00",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
                onClick={() => {
                  window.location.reload();
                }}
              >
                Download More Models
              </button>
            </div>
          </div>

          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
            onClick={() => setSelectionVisible(false)}
          ></div>
        </>
      )}
    </header>
  );
}

function ModelLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div>
          <Loader />
        </div>
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <h3>Loading Model...</h3>
        </div>
      </div>
    </div>
  );
}

function ModelList({
  socket,
  setSelectionVisible,
  model,
  index,
}: {
  socket: Socket;
  setSelectionVisible: (arg0: boolean) => void;
  model: {
    config: {
      FILEPATH: string | null;
      model: string;
      downloadURL: string;
      requiredRAM: number;
      id: string;
      fileSize: number;
    };
  };
  index: number;
}) {
  const { ramUsage, diskUsage } = useModel();

  const [isDownloaded, setIsDownloaded] = useState(false);
  const { downloadProgress, setDownloadProgress } = useContext(
    DownloadProgressContext
  );
  const [loading, setLoading] = useState(false);

  const isRamSufficient = model.config.requiredRAM <= Number(ramUsage.totalRAM);
  const isDiskSufficient = model.config.fileSize < Number(diskUsage.freeDisk);

  useEffect(() => {
    localStorage.getItem(
      model.config.model
        .split("-")
        .slice(0, model.config.model.split("-").length - 1)
        .join("-")
    ) && setIsDownloaded(true);
  }, []);

  useEffect(() => {
    socket.on(
      "download_progress",
      (data: {
        percentage: number;
        downloadedBytes: number;
        contentLength: number;
        selectedModel: string;
      }) => {
        setDownloadProgress(data);
      }
    );
  }, [downloadProgress]);

  useEffect(() => {
    socket.on(
      "download_complete",
      (data: { selectedModel: string; downloadPath: string }) => {
        localStorage.setItem(
          data.selectedModel
            .split("-")
            .slice(0, data.selectedModel.split("-").length - 1)
            .join("-"),
          data.downloadPath
        );
        setIsDownloaded(true);
        setLoading(false);
        window.location.reload();
      }
    );
  }, []);

  useEffect(() => {
    socket.on("download_canceled", () => {
      setLoading(false);
    });
  }, []);

  const handleButtonCLick = () => {
    if (isDownloaded) {
      socket.emit("select_model", model.config);
      setSelectionVisible(false);
    } else {
      setLoading(true);
      socket.emit("download_model", model.config);
    }
  };

  return (
    <div>
      <div
        style={{
          flexDirection: "row",
          display: "flex",
          padding: "15px",
          marginBottom: index === models.length - 1 ? "0px" : "5px",
          borderBottom:
            index === models.length - 1 ? "none" : "1px solid white",
        }}
      >
        <div
          style={{
            flex: 0.7,
            flexDirection: "row",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2>Name: </h2>
            <h3>{model.config.model.split("-").join(" ").toUpperCase()}</h3>
          </div>
          <div>
            <h3> Model Size: {model.config.fileSize} GB</h3>
            <h4></h4>

            <h4
              style={{
                marginTop: "10px",
              }}
            >
              {isDiskSufficient ? "✅" : "❌"} {diskUsage.freeDisk} GB Available
            </h4>
          </div>
          <div>
            <h3> RAM: {model.config.requiredRAM} GB</h3>
            <h4></h4>

            <h4
              style={{
                marginTop: "10px",
              }}
            >
              {isRamSufficient ? "✅" : "❌"} {ramUsage.totalRAM} GB Available
            </h4>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 0.3,
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              {isDownloaded && (
                <button
                  onClick={() => {
                    handleButtonCLick();
                  }}
                  style={{
                    color: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "none",
                    fontSize: "1.2rem",
                    backgroundColor:
                      !isRamSufficient || !isDiskSufficient
                        ? "grey"
                        : "dodgerblue",
                    cursor:
                      isRamSufficient && isDiskSufficient
                        ? "pointer"
                        : "not-allowed",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  disabled={!isRamSufficient || !isDiskSufficient}
                >
                  Start
                </button>
              )}

              {isDownloaded && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to delete the model? This action cannot be undone."
                        )
                      ) {
                        socket.emit(
                          "delete_model",
                          localStorage.getItem(
                            model.config.model
                              .split("-")
                              .slice(
                                0,
                                model.config.model.split("-").length - 1
                              )
                              .join("-")
                          )
                        );
                        localStorage.removeItem(
                          model.config.model
                            .split("-")
                            .slice(0, model.config.model.split("-").length - 1)
                            .join("-")
                        );

                        setIsDownloaded(false);
                        window.location.reload();
                      }
                    }}
                    style={{
                      backgroundColor: "tomato",
                      color: "white",
                      padding: "10px",
                      borderRadius: "5px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      marginLeft: "10px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}

              {!isDownloaded && downloadProgress.percentage === 0 && (
                <button
                  onClick={() => {
                    handleButtonCLick();
                  }}
                  style={{
                    color: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "none",
                    fontSize: "1.2rem",
                    backgroundColor:
                      !isRamSufficient || !isDiskSufficient || loading
                        ? "grey"
                        : "dodgerblue",
                    cursor:
                      isRamSufficient && isDiskSufficient && !loading
                        ? "pointer"
                        : "not-allowed",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  disabled={!isRamSufficient || !isDiskSufficient || loading}
                >
                  Download
                  {loading && (
                    <Loader
                      size={20}
                      style={{
                        marginLeft: "10px",
                      }}
                    />
                  )}
                </button>
              )}
            </div>
          </div>

          {downloadProgress.selectedModel
            .split("-")
            .slice(0, model.config.model.split("-").length - 1)
            .join("-") ===
            model.config.model
              .split("-")
              .slice(0, model.config.model.split("-").length - 1)
              .join("-") && (
            <div
              style={{
                marginTop: "10px",
              }}
            >
              <progress
                id="file"
                value={downloadProgress.percentage.toString()}
                max="100"
              >
                {downloadProgress.percentage.toString()}%
              </progress>

              <h4
                style={{
                  marginTop: "10px",
                }}
              >
                {downloadProgress.percentage.toString()}% -{" "}
                {(
                  (downloadProgress.downloadedBytes / 1000000).toFixed(0) +
                  " MB"
                ).replace(/0+$/, "")}{" "}
                /{" "}
                {(
                  (downloadProgress.contentLength / 1000000).toFixed(0) + " MB"
                ).replace(/0+$/, "")}
              </h4>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
