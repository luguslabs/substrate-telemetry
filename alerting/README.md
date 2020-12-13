# Archipel Telemetry Bot

Archipel Telemetry Bot supervise a private archipel substrate telemetry content with the Polkadot nodes and send Alerting message in as a Telegram Bot.

This program includes:

- connexion to telemetry backend
- Node-telegram-bot-api : to publish alert message in a Telegram chat.

## Check And Alerts Bot Rules

| Telemetry Table Nodes Rules | Alert msg                                               |
| --------------------------- | ------------------------------------------------------- |
| checkActiveNodesNumber      | Active nodes alert ! Expected + ACTIVE_NODES_NUMBER     |
| checkPassiveNodesNumber     | Passive nodes alert ! Expected + PASSIVE_NODES_NUMBER   |
| checkSentryNodesNumber      | Sentry nodes alert ! Expected + SENTRY_NODES_NUMBER     |
| checkArchipelNodesNumber    | Archipel nodes alert ! Expected + ARCHIPEL_NODES_NUMBER |

## Build

```bash
docker build -t luguslabs/archipel-telemetry-bot .
```

## Run

```bash
docker run --rm -i --name archipel-telemetry-bot -d \
    -e TELEMETRY_URL=__TELEMETRY_URL__ \
    -e TELEGRAM_CHAT_ID=__TELEGRAM_CHAT_ID__\
    -e TELEGRAM_TOKEN=__TELEGRAM_TOKEN__ \
    luguslabs/archipel-telemetry-bot:test
```

- `TELEMETRY_URL` - like `ws://__IP OR_DNS__:8000/feed`
- `TELEGRAM_CHAT_ID` - like `-123456789`
- `TELEGRAM_TOKEN` - like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

## Network alerting examples

- **For Polkadot Network**

docker run --rm -i --name archipel-telemetry-bot -d \
 -e TELEMETRY_URL=**TELEMETRY_URL** \
 -e TELEGRAM_CHAT_ID=**TELEGRAM_CHAT_ID**\
 -e TELEGRAM_TOKEN=**TELEGRAM_TOKEN** \
 -e NETWORK=Polkadot \
 -e ACTIVE_NODES_NUMBER=3 \
 -e ACTIVE_NODES_PATTERN=archipel-validator- \
 -e PASSIVE_NODES_NUMBER=4 \
 -e PASSIVE_NODES_PATTERN=polkadot-node- \
 -e TOTAL_NODES_NUMBER=8 \
luguslabs/archipel-telemetry-bot:test

- **For Kusama Network**

docker run --rm -i --name archipel-telemetry-bot -d \
 -e TELEMETRY_URL=**TELEMETRY_URL** \
 -e TELEGRAM_CHAT_ID=**TELEGRAM_CHAT_ID**\
 -e TELEGRAM_TOKEN=**TELEGRAM_TOKEN** \
 -e NETWORK=Kusama \
 -e ACTIVE_NODES_NUMBER=1 \
 -e ACTIVE_NODES_PATTERN=archipel-kusama-node-active \
 -e PASSIVE_NODES_NUMBER=1 \
 -e PASSIVE_NODES_PATTERN=kusama-node- \
 -e TOTAL_NODES_NUMBER=2 \
luguslabs/archipel-telemetry-bot:test

- **For Archipel Network**

docker run --rm -i --name archipel-telemetry-bot -d \
 -e TELEMETRY_URL=**TELEMETRY_URL** \
 -e TELEGRAM_CHAT_ID=**TELEGRAM_CHAT_ID**\
 -e TELEGRAM_TOKEN=**TELEGRAM_TOKEN** \
 -e NETWORK=Archipel \
 -e ACTIVE_NODES_NUMBER=0 \
 -e PASSIVE_NODES_NUMBER=0 \
 -e TOTAL_NODES_NUMBER=9 \
luguslabs/archipel-telemetry-bot:test
