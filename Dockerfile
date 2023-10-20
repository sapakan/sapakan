FROM node:21

# Installing postgresql-client for waiting the DB to be ready
RUN apt-get update \
    && apt-get install --no-install-recommends -y postgresql-client=13+225 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /sapakan

# Install dependencies
COPY package.json yarn.lock /sapakan/
RUN yarn install \
    && yarn cache clean

COPY prisma /sapakan/prisma
COPY tsconfig.json docker-entrypoint.sh /sapakan/
COPY src /sapakan/src

EXPOSE 4000
ENTRYPOINT ["/sapakan/docker-entrypoint.sh"]
