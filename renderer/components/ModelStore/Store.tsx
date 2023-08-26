import { DownloadProgressContext } from "@/context/DownloadContext";
import HomeContext from "@/pages/api/home/home.context";
import socket from "@/socket/socket";
import { PluginWithModel } from "@/types/plugin";
import {
  getCurrentModelAPIKEY,
  isModelKeySet,
  saveCloudModel,
} from "@/utils/app/cloudModels";
import {
  currentModelPath,
  deleteModel,
  isModelDownloaded,
  saveLocalModels,
} from "@/utils/app/localModels";
import {
  IconBox,
  IconCheck,
  IconCircleCheck,
  IconCloud,
  IconDownload,
  IconExchange,
  IconEye,
  IconEyeOff,
  IconHeart,
  IconSelect,
  IconSend,
  IconSquareCheck,
  IconX,
} from "@tabler/icons-react";
import axios from "axios";
import Image from "next/image";
import React, { useCallback, useContext, useEffect, useState } from "react";

export const Header = ({
  setIsChanging,
}: {
  setIsChanging: (value: boolean) => void;
}) => {
  const buttons = [
    {
      text: "Publish your model",
      inverted: false,
      icon: IconSend,
      onCLick: () => {
        socket.emit(
          "open_link",
          "https://docs.google.com/forms/d/e/1FAIpQLSd1fHKtW2U71ggV8qnD5wYm796kqDKgRADI_WBjsZk1MR5ZEQ/viewform"
        );
      },
    },
    {
      text: "Request more models",
      inverted: false,
      icon: IconBox,
      onCLick: () => {
        socket.emit(
          "open_link",
          "https://docs.google.com/forms/d/e/1FAIpQLSd2wXYerD3qrGO3A-BeJjCHFxvYN0HYRGSCOMPKtZiSuBf8OA/viewform"
        );
      },
    },
    {
      text: "Donate now",
      inverted: true,
      icon: IconHeart,
      onCLick: () => {
        socket.emit("open_link", "https://app.freedomgpt.com/donation");
      },
    },
  ];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: "1px 0 1px 0",
      }}
      className="bg-white dark:bg-[#343541] border-black dark:border-white"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <div
          className="text-xl text-black dark:text-white"
          style={{
            fontWeight: "500",
            marginLeft: "1.3rem",
          }}
        >
          AI Cortex
        </div>
      </div>
      <div className="flex">
        {buttons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "1rem",
                backgroundColor: button.inverted ? "black" : "white",
                color: button.inverted ? "white" : "black",
                marginLeft: "0.25rem",
                padding: "1.2rem",
                fontWeight: "500",
                borderLeft: "1px solid black",
              }}
              onClick={() => {
                button.onCLick();
              }}
            >
              {button.text} <Icon className="ml-2" />
            </button>
          );
        })}

        <button
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "1rem",
            backgroundColor: "black",
            color: "white",
            padding: "2rem",
            fontWeight: "500",
            borderLeft: "1px solid white",
          }}
          onClick={() => {
            setIsChanging(false);
          }}
        >
          X
        </button>
      </div>
    </header>
  );
};

const Body = () => {
  const [showCloudModel, setShowCloudModel] = useState(false);
  return (
    <div className="bg-[#efefef] dark:bg-[#343541]">
      <div className="p-8">
        <h1
          style={{
            fontSize: 36,
            fontWeight: "300",
            lineHeight: "49px",
            textAlign: "left",
          }}
          className="text-black dark:text-white"
        >
          There are different types of Als.
        </h1>
        <h1
          style={{
            fontSize: 36,
            fontWeight: "300",
            lineHeight: "49px",
            textAlign: "left",
          }}
          className="text-black dark:text-white"
        >
          You have the freedom to make your choice.
        </h1>
      </div>

      <div
        className="flex flex-row"
        style={{
          minHeight: "calc(100vh - 200px)",
        }}
      >
        <div
          style={{
            flex: 0.25,
            borderWidth: "0 1px 0 0",
          }}
          className="bg-white dark:bg-[#343541] border-black dark:border-white"
        >
          <AIType
            setShowCloudModel={setShowCloudModel}
            showCloudModel={showCloudModel}
          />
        </div>
        <div
          style={{
            flex: 0.75,
            overflow: "auto", // Enable scrolling if content overflows
            maxHeight: "calc(100vh - 200px)", // Limit the maximum height to the viewport height
            paddingBottom: "5rem",
          }}
        >
          <Models showCloudModel={showCloudModel} />
        </div>
      </div>
    </div>
  );
};

const AIType = ({
  setShowCloudModel,
  showCloudModel,
}: {
  setShowCloudModel: (value: boolean) => void;
  showCloudModel: boolean;
}) => {
  const options = [
    {
      id: "edge",
      label: "Edge AI",
      icon: IconCircleCheck,
      description:
        "Edge AI is AI that runs locally on your machine. The data never leaves your device, so everything stays private. You can even use this AI when you are completely offline, on a plane, or a deserted island. It's AI that can never be taken away from you through the action of any individual, company, or government.",
    },
    {
      id: "cloud",
      label: "Cloud AI",
      icon: IconCloud,
      description:
        "Cloud AI is AI that is hosted in the cloud. It can run on more powerful machines, so you can access larger and therefore more powerful AI models. The tradeoff is that despite whatever guarantees the cloud providers make, because data leaves your device, you fundamentally have less privacy. The servers can also go offline for a number of reasons.",
    },
  ];
  const [selectedOption, setSelectedOption] = useState(options[0].id);

  const handleClick = (id: string) => {
    setSelectedOption(id);
    if (id === "cloud") {
      setShowCloudModel(true);
    } else {
      setShowCloudModel(false);
    }
  };

  return (
    <div>
      <div className="flex bg-white dark:bg-[#343541]">
        {options.map((option) => (
          <button
            key={option.id}
            className={`flex-1 py-2 border-black dark:border-white text-center ${
              selectedOption === option.id
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white text-black dark:bg-[#343541] dark:text-white"
            }`}
            onClick={(_e) => {
              handleClick(option.id);
            }}
            style={{
              height: "60px",
              borderWidth: "1px",
            }}
          >
            <option.icon
              className={`inline-block mr-2 ${
                selectedOption === option.id
                  ? "text-white dark:text-black"
                  : "text-black dark:text-white"
              }`}
            />
            {option.label}
          </button>
        ))}
      </div>
      <div
        className="m-4"
        style={{
          textAlign: "justify",
        }}
      >
        <p className="text-black dark:text-white">
          {options.find((option) => option.id === selectedOption)?.description}
        </p>
      </div>
    </div>
  );
};

interface CloudModel {
  id: string;
  model: string;
  description: string;
  tags: string[];
}

interface CloudModelOptionsProps extends CloudModel {}

const LocalModelOptions: React.FC<PluginWithModel["config"]> = ({
  model,
  description,
  fileSize,
  requiredRAM,
  downloadURL,
  tags,
  image,
  id,
  name,
}) => {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const {
    downloadProgress,
    setDownloadProgress,
    downloadStarted,
    setDownloadStarted,
  } = useContext(DownloadProgressContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsDownloaded(isModelDownloaded(id));
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
      (data: {
        modelData: PluginWithModel["config"];
        downloadPath: string;
      }) => {
        setIsDownloaded(true);
        setLoading(false);
        saveLocalModels(data, data.downloadPath);
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
      setDownloadProgress({
        percentage: 0,
        downloadedBytes: 0,
        contentLength: 0,
        selectedModel: "",
      });
      setDownloadStarted({
        selectedModel: data.selectedModel,
        started: true,
      });
    });
  }, []);

  const handleDownloadStart = () => {
    setLoading(true);
    socket.emit("download_model", {
      model,
      description,
      fileSize,
      requiredRAM,
      downloadURL,
      tags,
      image,
      id,
    });
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
    }
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete the model? This action cannot be undone."
      )
    ) {
      socket.emit("delete_model", currentModelPath(model));
      deleteModel(id);
      setIsDownloaded(false);
      window.location.reload();
    }
  };

  const handleModelChoose = () => {
    socket.emit("choose_model", {
      model,
      description,
      fileSize,
      requiredRAM,
      downloadURL,
      tags,
      image,
      id,
    });
  };

  return (
    <div
      className="flex bg-white"
      style={{
        border: "1px solid #000",
        height: "250px",
        minHeight: "250px",
        maxHeight: "250px",
      }}
    >
      <div>
        <div
          className="flex items-center justify-between"
          style={{
            height: "250px",
            minHeight: "250px",
            position: "relative",
          }}
        >
          <Image
            src={image}
            alt={model}
            width={350}
            height={350}
            style={{
              maxWidth: "auto",
              height: "230px",
              display: "block",
              margin: "auto",
            }}
          />

          <div
            className="flex items-center"
            style={{
              position: "absolute",
              top: "0.5rem",
            }}
          >
            {tags && tags.length > 0 && (
              <span
                className="text-white text-xs mr-2 p-2"
                style={{
                  backgroundColor: "#0000FF",
                  fontSize: "0.75rem",
                }}
              >
                {tags[0].toLocaleUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col  pb-0">
        <div className="flex-1 flex flex-col ">
          <h3 className="text-xl font-bold mb-2 p-4 pb-0 text-black">
            {name.toLocaleUpperCase()}
          </h3>
          <p
            className="mb-2 pl-4 pt-0 text-lg"
            style={{
              color: "gray",
            }}
          >
            {description}
          </p>

          {isDownloaded && !downloadStarted.started && (
            <div
              className="flex items-center justify-between mt-auto"
              style={{
                borderTop: "1px solid #000",
              }}
            >
              <div className="flex items-center pl-4">
                <span className="text-lg ml-1 text-black">
                  <span>
                    <strong> Already Downloaded</strong>
                  </span>{" "}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1rem",
                    backgroundColor: "#000",
                    marginLeft: "0.25rem",
                    padding: "1rem",
                    fontWeight: "500",
                    borderLeft: "1px solid black",
                    color: "white",
                  }}
                  onClick={() => {
                    handleModelChoose();
                  }}
                >
                  Change Path <IconSelect className="ml-2" />
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1rem",
                    backgroundColor: "#B00B1E",
                    padding: "1rem",
                    fontWeight: "500",
                    borderLeft: "1px solid black",
                    color: "white",
                  }}
                  onClick={() => {
                    handleDelete();
                  }}
                >
                  Delete <IconX className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {!isDownloaded && !downloadStarted.started && downloadURL && (
            <div
              className="flex items-center justify-between mt-auto"
              style={{
                borderTop: "1px solid #000",
              }}
            >
              <div className="flex items-center pl-4">
                <IconSquareCheck fill="#0000FF" color="#fff" />
                <span className="text-md ml-1 text-black">
                  <span className="mr-4">
                    Size: <strong>{fileSize} GB</strong>
                  </span>
                </span>

                <IconSquareCheck fill="#0000FF" color="#fff" />
                <span className="text-md ml-1 text-black">
                  <span>
                    RAM Requirements: <strong> {requiredRAM} GB</strong>
                  </span>{" "}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1rem",
                    backgroundColor: "#000",
                    marginLeft: "0.25rem",
                    padding: "1rem",
                    fontWeight: "500",
                    borderLeft: "1px solid black",
                    color: "white",
                  }}
                  onClick={() => {
                    handleModelChoose();
                  }}
                >
                  Select Model File <IconSelect className="ml-2" />
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1rem",
                    backgroundColor: "#0000FF",
                    padding: "1rem",
                    fontWeight: "500",
                    borderLeft: "1px solid black",
                    color: "white",
                  }}
                  onClick={() => {
                    handleDownloadStart();
                  }}
                >
                  Download <IconDownload className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {!isDownloaded && !downloadStarted.started && !downloadURL && (
            <div
              className="flex items-center justify-between mt-auto"
              style={{
                borderTop: "1px solid #000",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1rem",
                    backgroundColor: "#0000ff",
                    marginLeft: "0.25rem",
                    padding: "1rem",
                    fontWeight: "500",
                    borderLeft: "1px solid black",
                    color: "white",
                    width: "100%",
                  }}
                >
                  Coming Soon
                </span>
              </div>
            </div>
          )}

          {downloadStarted.started &&
            downloadStarted.selectedModel === model && (
              <div
                className="flex items-center justify-between mt-auto"
                style={{
                  borderTop: "1px solid #000",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "calc(100% - 120px)",
                    position: "absolute",
                    height: 56,
                    top: 0,
                    border: "1px solid #000",
                  }}
                >
                  <div
                    style={{
                      width: `${downloadProgress.percentage}%`,
                      position: "absolute",
                      height: 56,
                      top: 0,
                      backgroundColor: "#0000ff",
                      alignItems: "center",
                      display: "flex",
                      border: "1px solid #000",
                    }}
                    className=" transition-all duration-300 ease-linear"
                  />
                </div>
                <div className="flex rounded">
                  <div className="flex items-center pl-4 justify-between row">
                    <span
                      className="text-lg ml-1"
                      style={{
                        color: "gray",
                        zIndex: 100,
                      }}
                    >
                      <span>
                        <strong>Downloading...</strong>
                      </span>
                    </span>

                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: "1rem",
                        marginLeft: "0.25rem",
                        padding: "0.5rem",
                        fontWeight: "500",
                        color: "black",
                        zIndex: 100,
                        right: 120,
                        position: "absolute",
                      }}
                    >
                      {downloadProgress.downloadedBytes > 0 ? (
                        <span
                          style={{
                            color: "gray",
                          }}
                        >
                          {(downloadProgress.downloadedBytes / 1000000).toFixed(
                            0
                          )}{" "}
                          MB /{" "}
                          {(downloadProgress.contentLength / 1000000).toFixed(
                            0
                          )}{" "}
                          MB
                        </span>
                      ) : (
                        <span>Download Starting</span>
                      )}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: "1rem",
                      backgroundColor: "#B00B1E",
                      height: 56,
                      fontWeight: "500",
                      borderLeft: "1px solid black",
                      color: "white",
                      padding: "1rem",
                      right: 0,
                      width: 120,
                    }}
                    onClick={() => {
                      handleCancel();
                    }}
                  >
                    Cancel <IconX className="ml-2" />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const CloudModelOptions: React.FC<CloudModelOptionsProps> = ({
  model,
  description,
  tags,
  id,
}) => {
  const {
    state: { apiKey, serverSideApiKeyIsSet },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const isKeySet = isModelKeySet(id);
  const key = getCurrentModelAPIKEY(id);

  const [newKey, setNewKey] = useState(
    id === "gpt3.5" ? apiKey : key ? key : ""
  );

  const [isChanging, setIsChanging] = useState(
    id === "gpt3.5" ? !serverSideApiKeyIsSet && apiKey === "" : !isKeySet
  );

  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword(!showPassword);

  const handleApiKeyChange = useCallback(
    (apiKey: string) => {
      homeDispatch({ field: "apiKey", value: apiKey });

      localStorage.setItem("apiKey", apiKey);
    },
    [homeDispatch]
  );

  const handleEnterDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUpdateKey(newKey);
    }
  };

  const handleUpdateKey = (newKey: string) => {
    if (newKey === "") {
      alert("Please enter a valid API Key");
      return;
    }

    if (id === "gpt3.5") {
      handleApiKeyChange(newKey.trim());
    } else {
      saveCloudModel({
        config: { description, id, model, APIKEY: newKey.trim() },
      });
    }

    setIsChanging(false);
  };

  return (
    <div
      className="flex bg-white"
      style={{
        border: "1px solid #000",
        height: "250px",
        minHeight: "250px",
        maxHeight: "250px",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          height: "250px",
          minHeight: "250px",
          position: "relative",
        }}
      >
        <Image
          src={
            "https://firebasestorage.googleapis.com/v0/b/freedom-gpt.appspot.com/o/000freedomgpt_models%2Fchatgpt.png?alt=media&token=00360ebe-157a-41aa-98a9-19707d033364"
          }
          alt={model}
          width={350}
          height={350}
          style={{
            maxWidth: "auto",
            height: "230px",
            display: "block",
            margin: "auto",
          }}
        />

        <div
          className="flex items-center"
          style={{
            position: "absolute",
            top: "0.5rem",
          }}
        >
          {tags.length > 0 && (
            <span
              className="text-white text-xs mr-2 p-2"
              style={{
                backgroundColor: "#0000FF",
                fontSize: "0.75rem",
              }}
            >
              {tags[0].toLocaleUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col  pb-0">
        <div className="flex-1 flex flex-col ">
          <h3 className="text-xl font-bold mb-2 p-4 pb-0 text-black">
            {model.toLocaleUpperCase()}
          </h3>
          <div
            className="mb-2 pl-4 pt-0 text-lg"
            style={{
              color: "gray",
            }}
          >
            {description}
          </div>

          {isChanging && (
            <div
              className="flex items-center justify-between mt-auto"
              style={{
                borderTop: "1px solid #000",
              }}
            >
              <div
                className="flex items-center pl-4"
                style={{
                  position: "relative",
                  width: "40vw",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter API Key"
                  style={{
                    padding: "1rem",
                    paddingRight: "2.5rem",
                    marginRight: "1rem",
                    color: "black",
                    width: "44vw",
                  }}
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={handleEnterDown}
                />
                <button
                  onClick={togglePassword}
                  style={{
                    position: "absolute",
                    right: "2rem",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? (
                    <IconEye color="black" />
                  ) : (
                    <IconEyeOff color="black" />
                  )}
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1rem",
                    backgroundColor: "#0000FF",
                    padding: "1rem",
                    fontWeight: "500",
                    borderLeft: "1px solid black",
                    color: "white",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateKey(newKey);
                  }}
                >
                  Connect <IconCheck className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {!isChanging && (
            <div
              className="flex items-center justify-between mt-auto"
              style={{
                borderTop: "1px solid #000",
              }}
            >
              <div
                className="flex items-center pl-4"
                style={{
                  position: "relative",
                  width: "40vw",
                }}
              >
                <span className="text-lg ml-1 text-black">
                  Already Connected
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1rem",
                    backgroundColor: "#0000FF",
                    padding: "1rem",
                    fontWeight: "500",
                    borderLeft: "1px solid black",
                    color: "white",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsChanging(true);
                  }}
                >
                  Change <IconExchange className="ml-2" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Models = ({ showCloudModel }: { showCloudModel: boolean }) => {
  const [cloudLocalModels, setcloudLocalModels] = useState<
    Record<string, PluginWithModel> | undefined
  >(undefined);

  const fetchModelsFromCloud = async () => {
    try {
      const response = await axios
        .get<PluginWithModel[]>("https://app.freedomgpt.com/api/models")
        .then((res) => res.data);
      response.forEach((data: any) => {
        const plugin: PluginWithModel = {
          config: {
            model: data.model,
            downloadURL: data.downloadURL,
            requiredRAM: data.requiredRAM,
            fileSize: data.fileSize,
            description: data.description,
            id: data.id,
            image: data.image,
            tags: data.tags,
            name: data.name,
          },
        };
        setcloudLocalModels((prev) => {
          return {
            ...prev,
            [data.id]: plugin,
          };
        });
      });
    } catch (error) {
      console.error("Error fetching plugins:", error);
    }
  };

  useEffect(() => {
    fetchModelsFromCloud();
  }, []);

  return (
    <div>
      {showCloudModel ? (
        cloudData.map((model) => (
          <CloudModelOptions {...model} key={model.id} />
        ))
      ) : cloudLocalModels === undefined ||
        Object.values(cloudLocalModels).length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "calc(100vh - 200px)",
          }}
        >
          <h1
            style={{
              fontSize: 36,
              fontWeight: "300",
              lineHeight: "49px",
              textAlign: "left",
              fontFamily: "Manrope",
            }}
            className="text-black dark:text-white"
          >
            Loading
          </h1>
        </div>
      ) : (
        Object.values(cloudLocalModels).map((model) => {
          return <LocalModelOptions {...model.config} key={model.config.id} />;
        })
      )}
    </div>
  );
};

const cloudData = [
  {
    tags: ["online", "new"],
    description: "ChatGPT 3.5",
    model: "ChatGPT 3.5",
    id: "gpt3.5",
  },
  // {
  //   tags: ["online", "new"],
  //   description: "Liberty",
  //   model: "liberty-cloud",
  //   id: "liberty-cloud",
  // },
];

export default function ModelStore({
  setIsChanging,
}: {
  setIsChanging: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        zIndex: 110,
      }}
    >
      <Header setIsChanging={setIsChanging} />
      <Body />
    </div>
  );
}
