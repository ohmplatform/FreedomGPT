import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import Loader from "./components/Loader";
import { DownloadProgressContext } from "./context/DownloadContext";
import { useModel } from "./context/ModelSelection";
import Main from "./screens/Main";
import models, { Model } from "../../src/modelConfig";

const App = ({ socket }: { socket: Socket }) => {
  const { selectedModel, modelLoading, modelLoaded } = useModel();
  const [selectionVisible, setSelectionVisible] = useState(false);

  return (
    <div>
      {!selectedModel && !modelLoading && (
        <div
          style={{
            width: "90%",
            backgroundColor: "black",
            margin: "auto",
            borderRadius: "10px",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <ModelLists
            socket={socket}
            setSelectionVisible={setSelectionVisible}
          />
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
              width: "80%",
              backgroundColor: "black",
              margin: "auto",
              borderRadius: "10px",
              position: "absolute",
              top: "5vh",
              zIndex: 1001,
            }}
          >
            <ModelLists
              socket={socket}
              setSelectionVisible={setSelectionVisible}
            />

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

      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        <p
          style={{
            marginRight: "1rem",
            backgroundColor: "#A52A2A",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "1.2rem",
            padding: "0.5rem 1rem",
            textDecoration: "none",
          }}
          onClick={() => {
            socket.emit("open_github");
          }}
        >
          Github
        </p>
        <p
          style={{
            marginRight: "1rem",
            backgroundColor: "#7289DA",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "1.2rem",
            padding: "0.5rem 1rem",
            textDecoration: "none",
          }}
          onClick={() => {
            socket.emit("open_discord");
          }}
        >
          Discord
        </p>
      </div>
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

const ModelLists = ({
  socket,
  setSelectionVisible,
}: {
  socket: Socket;
  setSelectionVisible: (arg0: boolean) => void;
}) => {
  const { ramUsage, diskUsage } = useModel();

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: "80%" }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell
              align="center"
              style={{
                fontSize: "24px",
              }}
            ></TableCell>
            <TableCell
              align="center"
              style={{
                fontSize: "24px",
              }}
            >
              Al Model
            </TableCell>
            <TableCell
              align="center"
              style={{
                fontSize: "24px",
              }}
            >
              Version
            </TableCell>
            <TableCell
              align="left"
              style={{
                position: "relative",
                fontSize: "24px",
              }}
            >
              Size
              <span
                style={{
                  fontSize: "10px",
                  position: "absolute",
                  top: "2.2rem",
                  width: "100%",
                  left: 14,
                  whiteSpace: "nowrap",
                }}
              >
                {diskUsage.freeDisk} GB Available
              </span>
            </TableCell>
            <TableCell
              align="left"
              style={{
                position: "relative",
                fontSize: "24px",
              }}
            >
              RAM
              <span
                style={{
                  fontSize: "10px",
                  position: "absolute",
                  top: "2.2rem",
                  width: "100%",
                  left: 14,
                  whiteSpace: "nowrap",
                }}
              >
                {ramUsage.totalRAM} GB Available
              </span>
            </TableCell>
            <TableCell
              align="center"
              style={{
                fontSize: "24px",
                flex: 1,
              }}
            >
              Download
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {models.map((model, index) => (
            <ModelRow
              key={index}
              model={model}
              setSelectionVisible={setSelectionVisible}
              socket={socket}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const ModelRow = ({
  model,
  setSelectionVisible,
  socket,
}: {
  model: Model;
  setSelectionVisible: (arg0: boolean) => void;
  socket: Socket;
}) => {
  const { ramUsage, diskUsage, selectedModel } = useModel();

  const [isDownloaded, setIsDownloaded] = useState(false);
  const {
    downloadProgress,
    setDownloadProgress,
    downloadStarted,
    setDownloadStarted,
  } = useContext(DownloadProgressContext);
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
      window.location.reload();
    });
  }, []);

  useEffect(() => {
    socket.on("download_started", (data) => {
      setDownloadStarted({
        selectedModel: data.selectedModel,
        started: true,
      });
      setDownloadProgress({
        percentage: 0,
        downloadedBytes: 0,
        contentLength: data.contentLength,
        selectedModel: "",
      });
    });
  }, []);

  const handleStart = () => {
    if (isDownloaded) {
      socket.emit("select_model", model.config);
      setSelectionVisible(false);
    } else {
      setLoading(true);
      socket.emit("download_model", model.config);
    }
  };

  const handleCancel = () => {
    if (
      confirm(
        "Are you sure you want to cancel the download? This action cannot be undone."
      )
    ) {
      socket.emit("cancel_download");
      setLoading(false);
      setDownloadProgress({
        percentage: 0,
        downloadedBytes: 0,
        contentLength: 0,
        selectedModel: "",
      });
      window.location.reload();
    }
  };

  const handleDelete = () => {
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
            .slice(0, model.config.model.split("-").length - 1)
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
  };

  const handleModelChoose = () => {
    socket.emit("choose_model", model.config);
    setSelectionVisible(false);
  };

  return (
    <TableRow
      sx={{
        "&:last-child td, &:last-child th": { border: 0 },
        "& td": {
          fontSize: "1.2rem",
        },
      }}
    >
      <TableCell align="center">
        {isDownloaded && !downloadStarted.started && (
          <button
            onClick={() => {
              handleStart();
            }}
            style={{
              color: "white",
              padding: "10px 20px",
              borderRadius: "5px",
              border: "none",
              fontSize: "1.2rem",
              backgroundColor:
                selectedModel === model.config.model
                  ? "transparent"
                  : "dodgerblue",
              cursor:
                selectedModel === model.config.model
                  ? "not-allowed"
                  : "pointer",
            }}
            disabled={
              selectedModel === model.config.model ||
              !isRamSufficient ||
              !isDiskSufficient
            }
          >
            {selectedModel === model.config.model ? "Selected" : "Select"}
          </button>
        )}
        {downloadStarted.started &&
          downloadStarted.selectedModel === model.config.model && (
            <button
              onClick={() => {
                handleCancel();
              }}
              style={{
                color: "white",
                padding: "10px 20px",
                borderRadius: "5px",
                border: "none",
                fontSize: "1.2rem",
                backgroundColor: "red",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
      </TableCell>
      <TableCell align="center">
        {model.config.model.split("-")[0].toUpperCase()}
      </TableCell>

      <TableCell align="center">
        {model.config.model.split("-").slice(1).join(" ").toUpperCase()}
      </TableCell>
      <TableCell align="center">
        {isDiskSufficient ? "✅" : "❌"} {model.config.fileSize} GB
      </TableCell>
      <TableCell align="center">
        {isRamSufficient ? "✅" : "❌"} {model.config.requiredRAM} GB
      </TableCell>
      <TableCell
        align="center"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-evenly",
          flexDirection: "row",
          minWidth: "16vw",
          border: "none",
        }}
      >
        {isDownloaded && !downloadStarted.started && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row",
              width: "90%",
            }}
          >
            <button
              style={{
                backgroundColor: "transparent",
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                border: "none",
                fontSize: "1.2rem",
              }}
            >
              Downloaded
            </button>

            <button
              onClick={() => {
                handleDelete();
              }}
              style={{
                backgroundColor: "transparent",
                color: "red",
                padding: "10px",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              Delete
            </button>
          </div>
        )}

        {!isDownloaded && !downloadStarted.started && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row",
              width: "90%",
            }}
          >
            <button
              onClick={() => {
                handleStart();
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
                    : "green",
                cursor:
                  isRamSufficient && isDiskSufficient && !loading
                    ? "pointer"
                    : "not-allowed",
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

            <button
              onClick={() => {
                handleModelChoose();
              }}
              style={{
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                border: "none",
                fontSize: "1.2rem",
                backgroundColor:
                  !isRamSufficient || !isDiskSufficient ? "grey" : "dodgerblue",
                cursor:
                  isRamSufficient && isDiskSufficient
                    ? "pointer"
                    : "not-allowed",
              }}
              disabled={!isRamSufficient || !isDiskSufficient}
            >
              Choose
            </button>
          </div>
        )}

        {downloadStarted.started &&
          downloadStarted.selectedModel === model.config.model && (
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
      </TableCell>
    </TableRow>
  );
};
