/* eslint-disable no-inner-declarations */
const fs = require("fs").promises;
const puppeteer = require("puppeteer");

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

    console.log("Fetching JSON debug data");

    const rawMetrics = await page.evaluate(() => {
      const metrics = $.xmo.getValuesTree("Device"); // eslint-disable-line no-undef

      return metrics.Device;
    });

    await browser.close();

    const {
      DSL: {
        Lines: [line],
        Channels: [channel],
      },
    } = rawMetrics;

    const {
      Status: status,
      ConnectionTime: connectionTime,
      CurrentProfile: currentProfile,
      DownstreamAttenuation: downstreamAttenuation,
      DownstreamMaxBitRate: downstreamMaxBitRate,
      DownstreamNoiseMargin: downstreamNoiseMargin,
      DownstreamPower: downstreamPower,
      IDDSLAM: idDSLAM,
      LinkStatus: linkStatus,
      Stats: {
        BytesSent: bytesSent,
        BytesReceived: bytesReceived,
        ErrorsReceived: errorsReceived,
        ErrorsSent: errorsSent,
        Total: {
          ErroredSecs: totalErroredSecs,
          SeverelyErroredSecs: totalSeverelyErroredSecs,
          UnavailableSeconds: totalUnavailableSeconds,
          LinkRetrain: totalLinkRetrain,
          LossOfFraming: totalLossOfFraming,
        },
      },
      UpstreamAttenuation: upstreamAttenuation,
      UpstreamMaxBitRate: upstreamMaxBitRate,
      UpstreamNoiseMargin: upstreamNoiseMargin,
      UpstreamPower: upstreamPower,
      VectoringState: vectoringState,
    } = line;

    const {
      DownstreamCurrRate: downstreamCurrRate,
      LinkEncapsulationUsed: linkEncapsulationUsed,
      UpstreamCurrRate: upstreamCurrRate,
    } = channel;

    const metrics = {
      status,
      connectionTime,
      currentProfile,
      downstreamAttenuation: downstreamAttenuation / 10,
      downstreamMaxBitRate,
      downstreamNoiseMargin: downstreamNoiseMargin / 10,
      downstreamPower: downstreamPower / 10,
      idDSLAM,
      linkStatus,
      bytesSent,
      bytesReceived,
      errorsReceived,
      errorsSent,
      totalErroredSecs,
      totalSeverelyErroredSecs,
      totalUnavailableSeconds,
      totalLinkRetrain,
      totalLossOfFraming,
      upstreamAttenuation: upstreamAttenuation / 10,
      upstreamMaxBitRate,
      upstreamNoiseMargin: upstreamNoiseMargin / 10,
      upstreamPower: upstreamPower / 10,
      vectoringState,
      downstreamCurrRate,
      linkEncapsulationUsed,
      upstreamCurrRate,
    };

    metrics.timestamp = Date.now();

    console.log(metrics);

    const previousStatus = await getPreviousStatus();
    console.log("Previous connection status was", previousStatus);

    const currentStatus = metrics.status;
    console.log("Current connection status is", currentStatus);

    await fs.appendFile("metrics.log", JSON.stringify(metrics) + "\n");
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

console.log("\n\n\n\n\n");

start()
  .then(() => console.log("Done fetching router metrics\n\n\n\n\n\n"))
  .catch((error) => {
    console.error("Caught an error", error);

    process.exit(1);
  });
