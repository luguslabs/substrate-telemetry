import { VERSION, timestamp, FeedMessage, Types, Maybe, sleep } from "./common";

import { ACTIONS } from "./common/feed";

const TelegramBot = require("node-telegram-bot-api");

const { TELEMETRY_URL, TELEGRAM_CHAT_ID, TELEGRAM_TOKEN } = process.env;

const bot = new TelegramBot(TELEGRAM_TOKEN);

const NETWORK = "NETWORK" in process.env ? process.env.NETWORK : "Polkadot";

const ALERTS_CHECK_EVERY =
  "ALERTS_CHECK_EVERY" in process.env
    ? parseInt(process.env.ALERTS_CHECK_EVERY)
    : 30000;

const ACTIVE_NODES_NUMBER =
  "ACTIVE_NODES_NUMBER" in process.env
    ? parseInt(process.env.ACTIVE_NODES_NUMBER)
    : 3;

const PASSIVE_NODES_NUMBER =
  "PASSIVE_NODES_NUMBER" in process.env
    ? parseInt(process.env.PASSIVE_NODES_NUMBER)
    : 6;

const PUBLIC_NODES_NUMBER =
  "PUBLIC_NODES_NUMBER" in process.env
    ? parseInt(process.env.PUBLIC_NODES_NUMBER)
    : 4;

const ARCHIPEL_NODES_NUMBER =
  "ARCHIPEL_NODES_NUMBER" in process.env
    ? parseInt(process.env.ARCHIPEL_NODES_NUMBER)
    : 13;

const BOT_NAME = "Archipel Telemetry Bot";
const BOT_ID =
  "[ " + BOT_NAME + " - ID " + Math.floor(Math.random() * 1000) + " ]\n";
const BOT_TARGET = "Supervised URL [" + TELEMETRY_URL + "]\n";
const BOT_PREFIX_MSG = BOT_ID + BOT_TARGET;

const ALERT_ACTIVE_NODES_NUMBER =
  "Active nodes alert ! Expected " + ACTIVE_NODES_NUMBER;

const ALERT_PASSIVE_NODES_NUMBER =
  "Passive nodes alert ! Expected " + PASSIVE_NODES_NUMBER;

const ALERT_PUBLIC_NODES_NUMBER =
  "Public nodes alert ! Expected " + PUBLIC_NODES_NUMBER;

const ALERT_ARCHIPEL_NODES_NUMBER =
  "Archipel nodes alert ! Expected " + ARCHIPEL_NODES_NUMBER;

const TIMEOUT_BASE = (1000 * 5) as Types.Milliseconds; // 5 seconds
const TIMEOUT_MAX = (1000 * 60 * 5) as Types.Milliseconds; // 5 minutes

export class Connection {
  public static async create(): Promise<Connection> {
    return new Connection(await Connection.socket());
  }

  private static readonly utf8decoder = new TextDecoder("utf-8");

  private static async socket(): Promise<WebSocket> {
    let socket = await Connection.trySocket();
    let timeout = TIMEOUT_BASE;

    while (!socket) {
      await sleep(timeout);

      timeout = Math.min(timeout * 2, TIMEOUT_MAX) as Types.Milliseconds;
      socket = await Connection.trySocket();
    }

    return socket;
  }

  private static async trySocket(): Promise<Maybe<WebSocket>> {
    return new Promise<Maybe<WebSocket>>((resolve, _) => {
      function clean() {
        socket.removeEventListener("open", onSuccess);
        socket.removeEventListener("close", onFailure);
        socket.removeEventListener("error", onFailure);
      }

      function onSuccess() {
        clean();
        resolve(socket);
      }

      function onFailure() {
        clean();
        resolve(null);
      }
      const socket = new WebSocket(TELEMETRY_URL);

      socket.binaryType = "arraybuffer";
      socket.addEventListener("open", onSuccess);
      socket.addEventListener("error", onFailure);
      socket.addEventListener("close", onFailure);
    });
  }

  private pingId = 0;
  private pingTimeout: NodeJS.Timer;
  private pingSent: Maybe<Types.Timestamp> = null;

  private socket: WebSocket;

  private archipelNodes: Set<Types.NodeName>;

  private passiveNodes: Set<Types.NodeName>;

  private activeNodes: Set<Types.NodeName>;

  private publicNodes: Set<Types.NodeName>;

  private nodeIdToName: Map<Types.NodeId, Types.NodeName>;

  private nameToNodeID: Map<Types.NodeName, Types.NodeId>;

  constructor(socket: WebSocket) {
    this.nodeIdToName = new Map();
    this.nameToNodeID = new Map();
    this.archipelNodes = new Set();
    this.passiveNodes = new Set();
    this.activeNodes = new Set();
    this.publicNodes = new Set();

    this.socket = socket;
    this.bindSocket();

    setInterval(
      () =>
        this.checkAlerts(
          this.archipelNodes,
          this.passiveNodes,
          this.activeNodes,
          this.publicNodes
        ),
      ALERTS_CHECK_EVERY
    );
  }

  public handleMessages = (messages: FeedMessage.Message[]) => {
    for (const message of messages) {
      switch (message.action) {
        case ACTIONS.FeedVersion: {
          if (message.payload !== VERSION) {
            console.log("ACTIONS.FeedVersion");
            console.log(message.payload);
            //  this.clean();

            return;
          }

          break;
        }

        case ACTIONS.BestBlock: {
          console.log("ACTIONS.BestBlock");
          // console.log(JSON.stringify(message.payload));
          const [best, blockTimestamp, blockAverage] = message.payload;

          break;
        }

        case ACTIONS.BestFinalized: {
          console.log("ACTIONS.BestFinalized");
          //  console.log(JSON.stringify(message.payload));
          const [finalized /*, hash */] = message.payload;

          break;
        }

        case ACTIONS.AddedNode: {
          console.log("ACTIONS.AddedNode");
          console.log(JSON.stringify(message.payload));
          const [
            id,
            nodeDetails,
            nodeStats,
            nodeIO,
            nodeHardware,
            blockDetails,
            location,
            connectedAt,
          ] = message.payload;

          this.clearMapsByNodeName(nodeDetails[0]);

          this.nodeIdToName.set(id, nodeDetails[0]);

          this.nameToNodeID.set(nodeDetails[0], id);

          if (nodeDetails[0].includes("public")) {
            this.publicNodes.add(nodeDetails[0]);
          }
          if (nodeDetails[0].includes("active")) {
            this.activeNodes.add(nodeDetails[0]);
          }

          if (nodeDetails[0].includes("passive")) {
            this.passiveNodes.add(nodeDetails[0]);
          }

          if (nodeDetails[0].includes("archipel")) {
            this.archipelNodes.add(nodeDetails[0]);
          }

          break;
        }

        case ACTIONS.RemovedNode: {
          console.log("ACTIONS.RemovedNode");
          console.log(JSON.stringify(message.payload));
          const id = message.payload;

          const name = this.nodeIdToName.get(id);
          this.clearMapsByNodeName(name);
          this.nameToNodeID.delete(name);
          this.nodeIdToName.delete(id);

          break;
        }

        case ACTIONS.StaleNode: {
          // console.log("ACTIONS.StaleNode");
          const id = message.payload;

          break;
        }

        case ACTIONS.LocatedNode: {
          // console.log("ACTIONS.LocatedNode");
          // console.log(JSON.stringify(message.payload));
          const [id, lat, lon, city] = message.payload;

          break;
        }

        case ACTIONS.ImportedBlock: {
          // console.log("ACTIONS.ImportedBlock");
          // console.log(JSON.stringify(message.payload));
          const [id, blockDetails] = message.payload;

          break;
        }

        case ACTIONS.FinalizedBlock: {
          // console.log("ACTIONS.FinalizedBlock");
          // console.log(JSON.stringify(message.payload));
          const [id, height, hash] = message.payload;

          break;
        }

        case ACTIONS.NodeStats: {
          // console.log("ACTIONS.NodeStats");
          // console.log(JSON.stringify(message.payload));
          const [id, nodeStats] = message.payload;

          break;
        }

        case ACTIONS.NodeHardware: {
          // console.log("ACTIONS.NodeHardware");
          // console.log(JSON.stringify(message.payload));
          const [id, nodeHardware] = message.payload;

          break;
        }

        case ACTIONS.NodeIO: {
          // console.log("ACTIONS.NodeIO");
          // console.log(JSON.stringify(message.payload));
          const [id, nodeIO] = message.payload;

          break;
        }

        case ACTIONS.TimeSync: {
          // console.log("ACTIONS.TimeSync");
          // console.log(JSON.stringify(message.payload));
          break;
        }

        case ACTIONS.AddedChain: {
          console.log("ACTIONS.AddedChain");
          //console.log(JSON.stringify(message.payload));
          const [label, nodeCount] = message.payload;

          break;
        }

        case ACTIONS.RemovedChain: {
          console.log("ACTIONS.RemovedChain");
          // console.log(JSON.stringify(message.payload));
          break;
        }

        case ACTIONS.SubscribedTo: {
          console.log("ACTIONS.SubscribedTo");
          // console.log(JSON.stringify(message.payload));
          break;
        }

        case ACTIONS.UnsubscribedFrom: {
          console.log("ACTIONS.UnsubscribedFrom");
          //console.log(JSON.stringify(message.payload));
          break;
        }

        case ACTIONS.Pong: {
          console.log("ACTIONS.Pong");
          this.pong(Number(message.payload));
          break;
        }

        default: {
          break;
        }
      }
    }
  };
  private checkAlerts(
    archipelNodes: Set<Types.NodeName>,
    passiveNodes: Set<Types.NodeName>,
    activeNodes: Set<Types.NodeName>,
    publicNodes: Set<Types.NodeName>
  ) {
    console.log("archipelNodes size=" + archipelNodes.size);
    if (this.archipelNodes.size != ARCHIPEL_NODES_NUMBER) {
      bot.sendMessage(
        TELEGRAM_CHAT_ID,
        BOT_PREFIX_MSG + ALERT_ARCHIPEL_NODES_NUMBER
      );
    }
    console.log("passiveNodes size=" + passiveNodes.size);
    if (this.passiveNodes.size != PASSIVE_NODES_NUMBER) {
      bot.sendMessage(
        TELEGRAM_CHAT_ID,
        BOT_PREFIX_MSG + ALERT_PASSIVE_NODES_NUMBER
      );
    }
    console.log("activeNodes size=" + activeNodes.size);
    if (this.activeNodes.size != ACTIVE_NODES_NUMBER) {
      bot.sendMessage(
        TELEGRAM_CHAT_ID,
        BOT_PREFIX_MSG + ALERT_ACTIVE_NODES_NUMBER
      );
    }
    console.log("publicNodes size=" + publicNodes.size);
    if (this.publicNodes.size != PUBLIC_NODES_NUMBER) {
      bot.sendMessage(
        TELEGRAM_CHAT_ID,
        BOT_PREFIX_MSG + ALERT_PUBLIC_NODES_NUMBER
      );
    }
  }

  private clearMapsByNodeName(name: Types.NodeName) {
    if (this.archipelNodes.has(name)) {
      this.archipelNodes.delete(name);
    }

    if (this.passiveNodes.has(name)) {
      this.passiveNodes.delete(name);
    }

    if (this.activeNodes.has(name)) {
      this.activeNodes.delete(name);
    }

    if (this.publicNodes.has(name)) {
      this.publicNodes.delete(name);
    }
  }

  private bindSocket() {
    this.ping();

    this.socket.send(`subscribe:` + NETWORK);

    this.socket.addEventListener("message", this.handleFeedData);
    this.socket.addEventListener("close", this.handleDisconnect);
    this.socket.addEventListener("error", this.handleDisconnect);
  }

  private ping = () => {
    if (this.pingSent) {
      this.handleDisconnect();
      return;
    }

    this.pingId += 1;
    this.pingSent = timestamp();
    this.socket.send(`ping:${this.pingId}`);

    this.pingTimeout = setTimeout(this.ping, 30000);
  };

  private pong(id: number) {
    if (!this.pingSent) {
      console.error("Received a pong without sending a ping first");

      this.handleDisconnect();
      return;
    }

    if (id !== this.pingId) {
      console.error("pingId differs");

      this.handleDisconnect();
    }

    const latency = timestamp() - this.pingSent;
    this.pingSent = null;

    console.log("latency", latency);
  }

  private clean() {
    clearTimeout(this.pingTimeout);
    this.pingSent = null;

    this.socket.removeEventListener("message", this.handleFeedData);
    this.socket.removeEventListener("close", this.handleDisconnect);
    this.socket.removeEventListener("error", this.handleDisconnect);
  }

  private handleFeedData = (event: MessageEvent) => {
    const data =
      typeof event.data === "string"
        ? ((event.data as any) as FeedMessage.Data)
        : ((Connection.utf8decoder.decode(
            event.data
          ) as any) as FeedMessage.Data);

    this.handleMessages(FeedMessage.deserialize(data));
  };

  private handleDisconnect = async () => {
    this.clean();
    this.socket.close();
    this.socket = await Connection.socket();
    this.bindSocket();
  };
}