#### BUILDER IMAGE  ####
FROM node:12-alpine
LABEL description="Polkadot Telemetry Alerting bot "

COPY . .
RUN yarn install && \
    yarn build && \
    yarn cache clean

ENV TELEMETRY_URL=
ENV TELEGRAM_TOKEN=
ENV TELEGRAM_CHAT_ID=

CMD [ "node", "/dist/app.js" ]
