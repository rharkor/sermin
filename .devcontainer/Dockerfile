FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends git-cola git zsh nano vim

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# Install more global node modules
RUN su node -c "npm install -g npm@latest"
RUN su node -c "npm install -g prisma"

# Install bun
RUN /bin/bash -c "curl -fsSL https://bun.sh/install | bash"

# Install pg_dump
RUN echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/postgres.list
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN apt-get update && apt-get install -y postgresql-client-13 postgresql-client-14 postgresql-client-15 postgresql-client-16