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

# If you want to run the application directly (Mac and Windows only)

```sh
git clone https://github.com/ohmplatform/FreedomGPT.git freedom-gpt
cd freedom-gpt
yarn install
yarn start:prod
```

# If you want to contribute to the project

## Working with the repository

```sh
git clone --recursive https://github.com/ohmplatform/FreedomGPT.git freedom-gpt
cd freedom-gpt
yarn install
```

# Building the alpaca.cpp library

## Building from Source (MacOS/Linux)

```sh
cd alpaca.cpp
make chat
```

## Building from Source (Windows)

- Download and install CMake: <https://cmake.org/download/>
- Run the following commands one by one:

```ps1
cd alpaca.cpp
cmake .
cmake --build . --config Release
```

- You should now have a `Release` folder with a `chat.exe` file inside it. You can run this file to test the chat client.

## Changing the API URL

We are using `http://localhost:8889` as the API URL, you can change it in the file
`src/index.ts`

## Running the application

To run the application, run the following command in your terminal:

```sh
yarn start

⦻ Make sure you are in the root directory of the project.
```

## Dockerizing the application

To run the docker image, run the following command in your terminal:

```sh
docker pull freedomgpt/freedomgpt
docker run -d -p 8889:8889 freedomgpt/freedomgpt
```

If you want to build the docker image yourself, run the following command in your terminal:

```sh
docker build -t freedomgpt/freedomgpt .

OR

yarn docker
```

## Working Video

https://user-images.githubusercontent.com/54356944/231952507-94ef7335-4238-43ee-8c45-677f6cd48988.mov

# Credits

This project utilizes several open-source packages and libraries, without which this project would not have been possible:

"alpaca.cpp" by antimatter15 - a C++ library for Alpaca API. https://github.com/antimatter15/alpaca.cpp

"LLAMA" by Facebook Research - a low-latency, large-scale approximate nearest neighbor search algorithm. https://github.com/facebookresearch/llama

"Alpaca" by Stanford CRFM - a framework for understanding and improving the efficiency and robustness of algorithms. https://crfm.stanford.edu/2023/03/13/alpaca.html

"alpaca-lora" by tloen - a Python library for working with LoRa radios and the Alpaca protocol. https://github.com/tloen/alpaca-lora

"alpaca-lora-7b" by Hugging Face - a pre-trained language model for the Alpaca protocol. https://huggingface.co/Sosaka/Alpaca-native-4bit-ggml/tree/main

We would like to express our gratitude to the developers of these packages and their contributors for making their work available to the public under open source licenses. Their contributions have enabled us to build a more robust and efficient project.

# LICENSE

See the <a href="/LICENSE"> LICENSE </a>file.
