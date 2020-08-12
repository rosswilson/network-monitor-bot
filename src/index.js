/* eslint-disable no-inner-declarations */
const fs = require("fs").promises;
const puppeteer = require("puppeteer");
const Push = require("pushover-notifications");

const PUSHOVER_USER = process.env["PUSHOVER_USER"];
const PUSHOVER_TOKEN = process.env["PUSHOVER_TOKEN"];
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"];

if (!ADMIN_PASSWORD) {
  console.error("You must set an ADMIN_PASSWORD environment variable");

  process.exit(1);
}

async function start() {
  let browser;

  try {
    const launchOptions = {};

    if (process.env.NATIVE_CHROMIUM) {
      launchOptions.executablePath = "chromium-browser";
    }

    if (process.env.VISIBLE) {
      launchOptions.headless = false;
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    await page.setViewport({ width: 1440, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36"
    );

    console.log("Opening router control panel");

    await page.goto("http://192.168.1.1/");

    await page.screenshot({
      path: `screenshots/login.png`,
      fullPage: true,
    });

    console.log("Typing credentials");

    await page.type("#name", "admin");
    await page.type("#password", ADMIN_PASSWORD);

    await page.keyboard.press("Enter");

    await page.waitForNavigation();

    await page.screenshot({
      path: `screenshots/main.png`,
      fullPage: true,
    });

    console.log("Navigating to device info page");

    await page.goto("http://192.168.1.1/0.1/gui/#/mybox/deviceInfo/deviceInfo");

    await page.screenshot({
      path: `screenshots/info.png`,
      fullPage: true,
    });

    const metrics = await page.evaluate(() => {
      const getBySelector = (selector) =>
        document.querySelector(selector).innerHTML; // eslint-disable-line no-undef

      const getByXdslKey = (key) =>
        getBySelector(`[ng-bind='deviceInfo.xdsl.${key}']`);

      return {
        systemUptime: getBySelector("#deviceInfoTip1 [hour-format]"),
        status: getBySelector("[ng-bind*='deviceInfo.xdsl.status']"),
        connectionTime: getBySelector("#deviceInfoTip5 [hour-format]"),
        linkStatus: getBySelector("[ng-bind*='deviceInfo.xdsl.linkStatus']"),
        standard: getByXdslKey("standard"),
        lineEncoding: getByXdslKey("lineEncoding"),
        linkEncapsulation: getByXdslKey("linkEncapsulation"),
        actualRateDown: getByXdslKey("actualRateDown"),
        actualRateUp: getByXdslKey("actualRateUp"),
        maximumRateDown: getByXdslKey("maximumRateDown"),
        maximumRateUp: getByXdslKey("maximumRateUp"),
        noiseMarginDown: getByXdslKey("noiseMarginDown"),
        noiseMarginUp: getByXdslKey("noiseMarginUp"),
        attenuationDown: getByXdslKey("attenuationDown"),
        attenuationUp: getByXdslKey("attenuationUp"),
        powerDown: getByXdslKey("powerDown"),
        powerUp: getByXdslKey("powerUp"),
      };
    });

    await browser.close();

    console.log(metrics);

    const previousStatus = await getPreviousStatus();
    console.log("Previous connection status was", previousStatus);

    const currentStatus = metrics.status;
    console.log("Current connection status is", currentStatus);

    await fs.appendFile("metrics.log", JSON.stringify(metrics) + "\n");

    const hasPusherCredentials = PUSHOVER_USER && PUSHOVER_TOKEN;
    const statusHasChanged = currentStatus !== previousStatus;

    if (!hasPusherCredentials) {
      console.log(
        "Skipping push notification as Pusher user and password aren't configured"
      );
    }

    if (!statusHasChanged) {
      console.log(
        "Skipping push notification as current status is the same as the previous status"
      );
    }

    if (hasPusherCredentials && statusHasChanged) {
      await new Promise((resolve, reject) => {
        const pushMessage = {
          message: `WAN connection has gone from ${previousStatus} to ${currentStatus}`,
          title: "Network Monitor",
          url: "http://192.168.1.1/",
          url_title: "Router Admin Panel",
        };

        const pusher = new Push({
          user: PUSHOVER_USER,
          token: PUSHOVER_TOKEN,
        });

        console.log("Sending a pusher message");

        pusher.send(pushMessage, function (err, result) {
          if (err) {
            console.log("Error sending pusher message", err);

            reject(err);
          }

          console.log("Success sending pusher message", result);

          resolve(result);
        });
      });
    }
  } catch (error) {
    // Ensure we always close the browser cleanly
    await browser.close();

    throw error;
  }
}

async function getPreviousStatus() {
  try {
    const previousMetrics = await fs.readFile("metrics.log", "utf-8");

    const lines = previousMetrics.trim().split("\n");
    const lastLine = lines[lines.length - 1];

    return JSON.parse(lastLine).status;
  } catch (error) {
    console.log(`Unable to read previous metrics: ${error.toString()}`);
  }

  return "UNKNOWN";
}

start()
  .then(() => console.log("Done fetching router metrics"))
  .catch((error) => {
    console.error("Caught an error", error);

    process.exit(1);
  });
