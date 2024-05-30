# FreedomGPT
This is the offical repository for the FreedomGPT application. It is built using [Electron](https://www.electronjs.org/) and [React](https://reactjs.org/) and allows users to run LLM models on their local machine.

![GitHub license](https://img.shields.io/badge/license-GNU-blue.svg)

![GitHub release](https://img.shields.io/github/release/ohmplatform/freedom-gpt-electron-app.svg)

![GitHub stars](https://img.shields.io/github/stars/ohmplatform/freedom-gpt-electron-app.svg)

![GitHub All Releases](https://img.shields.io/github/downloads/ohmplatform/freedom-gpt-electron-app/total.svg)

# Join our Discord Community
Join our Discord server to get the latest updates and to interact with the community.

[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/h77wvJS4ga)


# How to Contribute

## Prerequisites
- [Node.js](https://nodejs.org/en/download/)
- [Git](https://git-scm.com/downloads)

## Quick Install
```sh
git clone --recursive https://github.com/ohmplatform/FreedomGPT.git freedom-gpt
cd freedom-gpt
npx yarn install
```

### Building the llama.cpp library

#### macOS
```sh
cd llama.cpp
make
```

#### Windows
- Download and install CMake: <https://cmake.org/download/>
- Run the following commands:

```ps1
cd llama.cpp
cmake .
cmake --build . --config Release
```

You should now have a `Release` folder with a `main.exe` file inside it. You can run this file to test the chat client.


### Running the App
To run the app, run the following command in your terminal from the root directory of the project:

```sh
npx yarn start
```

## Changing Ports
If needed, ports can be changed in:
`src/ports.ts`

## Installation and Setup Guide for Linux

### Required Packages

To get started, you need to install several required packages. Run the following commands:

```bash
sudo apt install nodejs
sudo apt install yarn
sudo apt install git
sudo apt install make
sudo apt install g++
sudo apt install npm
```

### Build the Project

Navigate to the project directory and build it:

```bash
cd freedom-gpt/llama.cpp
make
cd ..
npm install
npm run
npm start
```

### Usage

### Working with Liberty Edge Models

You can manually download the Liberty Edge models and set the paths to these files from the AI Models screen.

### Mining Earnings

To enable mining earnings, follow these steps:

1. Download the XMRig Linux Static, CPU-only version from [xmrig.com/download](https://xmrig.com/download)
2. Extract the archive and copy the `xmrig` binary to the `freedom-gpt/miner/mac/fgptminer` directory:

```bash
# Assuming you have extracted xmrig in the current directory
cp xmrig freedom-gpt/miner/mac/fgptminer
```


<!-- ## Dockerizing the App

To run the docker image, run the following command in your terminal:

```sh
docker pull freedomgpt/freedomgpt
docker run -d -p 8889:8889 freedomgpt/freedomgpt
```

If you want to build the docker image yourself, run the following command in your terminal:

```sh
docker build -t freedomgpt/freedomgpt .

OR

npx yarn docker
``` -->

# Credits

This project utilizes several open-source packages and libraries, without which this project would not have been possible:

"llama.cpp" - C++ library. https://github.com/ggerganov/llama.cpp

"LLAMA" by Facebook Research - a low-latency, large-scale approximate nearest neighbor search algorithm. https://github.com/facebookresearch/llama

"Chatbot UI" - https://github.com/mckaywrigley/chatbot-ui

We would like to express our gratitude to the developers of these packages and their contributors for making their work available to the public under open source licenses. Their contributions have enabled us to build a more robust and efficient project.

# LICENSE

See the <a href="/LICENSE"> LICENSE </a>file.
