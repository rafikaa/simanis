# Sistem Managemen Efisiensi (SIMANIS)

## Getting Started
In order to run **SIMANIS** on your local machine all what you need to do is to have the prerequisites stated below installed on your machine and follow the installation steps down below.

### Prerequisites
  - Git
  - Node.js
  - Yarn or NPM

### Installing & Local Development

Start by typing the following commands in your terminal in order to get **SIMANIS** full package on your machine and starting a local development server with live reload feature.

```bash
git clone git@github.com:rafikaa/simanis.git simanis
cd simanis
npm install # or yarn
npm run dev # or yarn dev
```

### Run Using Docker
First thing first: install Docker!

- For Windows: https://docs.docker.com/docker-for-windows/install/
- For Mac: https://docs.docker.com/docker-for-mac/install/

#### Run Using Existing Image
First, you need to get access to SIMANIS heroku app, then run these commands.
```bash
docker run <image_name>:latest
```

#### Build Image Locally

Run these commands.

```bash
docker build . # build the docker image
docker run simanis:latest # run the docker image that has been built
```