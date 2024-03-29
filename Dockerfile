FROM node:lts

RUN mkdir -p /usr/src/app && \
    chown -R node:node /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY --chown=node:node install/package.json /usr/src/app/package.json

USER node

RUN npm install --only=prod && \
    npm cache clean --force

COPY --chown=node:node . /usr/src/app

ARG NODEBB_MONGO_CERTIFICATE
ENV NODEBB_CERT=${NODEBB_MONGO_CERTIFICATE}
RUN echo "${NODEBB_CERT}" > /usr/src/app/ca-certificate.crt

ENV NODE_ENV=production \
    daemon=false \
    silent=false

EXPOSE 4567

CMD node ./nodebb setup --skip-build; node ./nodebb build --series; node ./nodebb start
