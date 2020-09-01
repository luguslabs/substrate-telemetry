const TelegramBot = require("node-telegram-bot-api");
const dns = require("dns");

const { TELEGRAM_CHAT_ID, TELEGRAM_TOKEN } = process.env;

const bot = new TelegramBot(TELEGRAM_TOKEN);

const ALERTS_CHECK_EVERY =
  "ALERTS_CHECK_EVERY" in process.env
    ? parseInt(process.env.ALERTS_CHECK_EVERY)
    : 30000;

const BOT_NAME = "Archipel Telemetry Bot";
const BOT_ID =
  "[ " + BOT_NAME + " - ID " + Math.floor(Math.random() * 1000) + " ]\n";

const BOT_PREFIX_MSG = BOT_ID;

export class DNSChecker {
  public static async create(): Promise<DNSChecker> {
    return new DNSChecker();
  }

  constructor() {
    setInterval(this.checkDNS, ALERTS_CHECK_EVERY);
  }

  private checkDNS() {
    if (process.env.DNS_IP_LIST) {
      const instanceListToCheck = process.env.DNS_IP_LIST.split(",");

      for (const instance of instanceListToCheck) {
        // console.log(instance);

        const [dns1, dns2] = instance.split("#");
        console.log(dns1);
        console.log(dns2);

        dns.resolve4(dns1, function (err: any, addresses1: any) {
          if (err) {
            bot.sendMessage(
              TELEGRAM_CHAT_ID,
              BOT_PREFIX_MSG + "Error resolve dns " + dns1
            );
          }
          dns.resolve4(dns2, function (err: any, addresses2: any) {
            if (!err) {
              let alarm = true;
              if (addresses1[0] === addresses2[0]) {
                // console.log("dns2 == dns1 == ip  ");
                alarm = false;
              }
              if (alarm) {
                const mismatch =
                  "DNS <-> IP mismatch detected for DNS1:" +
                  dns1 +
                  "(" +
                  addresses1[0] +
                  "),DNS2:" +
                  dns2 +
                  "(" +
                  addresses2[0] +
                  ")";
                console.log(mismatch);
                bot.sendMessage(TELEGRAM_CHAT_ID, BOT_PREFIX_MSG + mismatch);
              }
            }
          });
        });
      }
    }
  }
}
