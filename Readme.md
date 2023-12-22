# Freedom GPT

![GitHub license](https://img.shields.io/badge/license-GNU-blue.svg)

![GitHub release](https://img.shields.io/github/release/ohmplatform/freedom-gpt-electron-app.svg)

![GitHub stars](https://img.shields.io/github/stars/ohmplatform/freedom-gpt-electron-app.svg)

![GitHub All Releases](https://img.shields.io/github/downloads/ohmplatform/freedom-gpt-electron-app/total.svg)

# Join our Discord Community

Join our Discord Server to get the latest updates and to interact with the community.

[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/h77wvJS4ga)

## Introduction

This is the repository for the Freedom GPT application. This application is built using
[Electron](https://www.electronjs.org/) and [React](https://reactjs.org/). It is a desktop application that
allows users to run alpaca models on their local machine.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable)
- [Git](https://git-scm.com/downloads)

# If you want to contribute to the project

## Working with the repository

```sh
git clone --recursive https://github.com/ohmplatform/FreedomGPT.git freedom-gpt
cd freedom-gpt
yarn install
```

# Building the llama.cpp library

## Building from Source (MacOS/Linux)

```sh
cd llama.cpp
make
```

## Building from Source (Windows)

- Download and install CMake: <https://cmake.org/download/>
- Run the following commands one by one:

```ps1
cd llama.cpp
cmake .
cmake --build . --config Release
```

- You should now have a `Release` folder with a `main.exe` file inside it. You can run this file to test the chat client.

## Running the application

To run the application, run the following command in your terminal:

```sh
yarn start

⦻ Make sure you are in the root directory of the project.
```

<!-- ## Working Video

https://user-images.githubusercontent.com/54356944/233825525-d95accf3-a26b-4f37-8fc1-6e922f782a66.mov -->

# Credits

This project utilizes several open-source packages and libraries, without which this project would not have been possible:

"llama.cpp" - C++ library. https://github.com/ggerganov/llama.cpp

"LLAMA" by Facebook Research - a low-latency, large-scale approximate nearest neighbor search algorithm. https://github.com/facebookresearch/llama

"Chatbot UI" - https://github.com/mckaywrigley/chatbot-ui

We would like to express our gratitude to the developers of these packages and their contributors for making their work available to the public under open source licenses. Their contributions have enabled us to build a more robust and efficient project.

# LICENSE

See the <a href="/LICENSE"> LICENSE </a>file.
