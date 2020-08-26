// This is the application entry point
import { Connection } from "./Connection";

(global as any).WebSocket = require("ws");

export class App {
  version: string;

  constructor() {
    console.log("Bot starting !");

    const mandatoryEnvToCheck = [
      "TELEMETRY_URL",
      "TELEGRAM_TOKEN",
      "TELEGRAM_CHAT_ID",
    ];
    mandatoryEnvToCheck.map((env) => {
      if (env in process.env) {
        console.log(env + " process.env ok.");
      } else {
        console.log(env + " process.env missing.");
        process.exit(1);
      }
    });

    const con = Connection.create();
  }
}

const app = new App();
