# Sistem Manajemen Efisiensi (SIMANIS)

## Getting Started

In order to run **SIMANIS** on your local machine all what you need to do is to have the prerequisites stated below installed on your machine and follow the installation steps down below.

### Prerequisites
  - Git: https://git-scm.com/download/win
  - Node.js: https://nodejs.org/en/download/
  - Yarn: https://yarnpkg.com/lang/en/docs/install/#windows-stable

### Installing & Local Development

Start by typing the following commands in your terminal in order to get **SIMANIS** full package on your machine and starting a local development server with live reload feature.

```bash
git clone https://github.com/rafikaa/simanis.git
cd simanis
yarn install
yarn dev
```

### Run Using Docker

First thing first: install Docker!

- For Windows: https://docs.docker.com/docker-for-windows/install/
- For Mac: https://docs.docker.com/docker-for-mac/install/

#### Build Docker Image

Run this command to build the app. Do this every time you make changes.

```bash
docker build . -t simanis
```

#### Run Docker Container

Run this command when you want to start the app that has been built.

```bash
docker run -d -p 8888:8888 --name simanis simanis
```

#### Stop Docker Container

Run these commands to stop and clean the app.

```bash
docker stop simanis
docker rm simanis
```