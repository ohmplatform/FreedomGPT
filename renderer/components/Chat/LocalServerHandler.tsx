import { useModel } from "@/context/ModelSelection";
import socket from "@/socket/socket";
import { currentModelPath } from "@/utils/app/localModels";
import React from "react";
import toast from "react-hot-toast";

const LocalServerHandler: React.FC = () => {
  const {
    localServer,
    setLocalServer,
    selectedModel,
    miningStatus,
    setMiningStatus,
    xmrLogs,
    serverLogs,
  } = useModel();

  const startServer = () => {
    if (!selectedModel.model) {
      toast.error("No model selected, Download a model first");
      window.location.href = "/ai-cortex";
      return;
    }

    setLocalServer({
      serverStatus: "loading",
      serverMessage: "Local server is loading",
      model: selectedModel,
    });

    socket &&
      socket.emit("select_model", {
        model: selectedModel,
        FILEPATH: currentModelPath(selectedModel.id),
      });
  };

  const startMining = () => {
    // setLocalServer({
    //   serverStatus: "loading",
    //   serverMessage: "Local server is loading",
    //   model: selectedModel,
    // });

    socket &&
      socket.emit("start_mining", {
        model: selectedModel,
        FILEPATH: currentModelPath(selectedModel.id),
      });
  };

  const stopServer = () => {
    socket && socket.emit("kill_process");

    setLocalServer({
      serverStatus: "stopped",
      serverMessage: "Local server is running",
      model: selectedModel,
    });
  };

  const stopMining = () => {
    socket && socket.emit("stop_mining");

    setMiningStatus({
      miningStatus: "stopped",
      miningMessage: "Mining is stopped",
    });
  };

  return (
    <>
      <div
        className="pl-[40px] pr-[40px]"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <div>
          <p className="font-bold text-lg mb-2 text-cyan-600">
            Server Information
          </p>
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="font-semibold text-black dark:text-white">
                Server Status:{" "}
              </span>
              <span
                className={`inline-block px-2 py-1 rounded ${
                  localServer.serverStatus === "running"
                    ? "bg-green-500 text-black dark:text-white"
                    : localServer.serverStatus === "loading"
                    ? "bg-yellow-500 text-black dark:text-white"
                    : "bg-red-500 text-black dark:text-white"
                }`}
              >
                {localServer.serverStatus}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-semibold text-black dark:text-white">
                Model:
              </span>{" "}
              <span className="text-black dark:text-white">
                {selectedModel.id}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-semibold text-black dark:text-white">
                Location:
              </span>{" "}
              <span className="text-black dark:text-white">
                {currentModelPath(selectedModel.id)}
              </span>
            </div>
          </div>
        </div>

        {localServer.serverStatus === "running" ? (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              stopServer();
            }}
          >
            Stop Local Server
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={() => {
              startServer();
            }}
          >
            Start Local Server
          </button>
        )}

        {miningStatus.miningStatus === "running" ? (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              stopMining();
            }}
          >
            Stop Mining
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={() => {
              startMining();
            }}
          >
            Start Mining
          </button>
        )}

        <div
          className="mt-4"
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            maxWidth: "50%",
          }}
        >
          <p className="font-bold text-lg mb-2 text-cyan-600">Mining Logs</p>
          <div className="bg-gray-800 text-white p-2 rounded">
            <pre className="text-sm">{xmrLogs}</pre>
          </div>
        </div>

        <div
          className="mt-4"
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            maxWidth: "50%",
          }}
        >
          <p className="font-bold text-lg mb-2 text-cyan-600">Server Logs</p>
          <div className="bg-gray-800 text-white p-2 rounded">
            <pre className="text-sm">{serverLogs}</pre>
          </div>
        </div>
      </div>
    </>
  );
};

export default LocalServerHandler;
