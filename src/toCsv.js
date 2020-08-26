const { argv } = require("process");
const fs = require("fs").promises;

async function readInputFile(path) {
  try {
    const body = await fs.readFile(path, "utf-8");

    return body;
  } catch (error) {
    console.error(`Error reading input file from path: ${path}`);

    process.exit(1);
  }
}

async function run() {
  const inputPath = argv[2];

  if (!inputPath) {
    console.info(
      "Provide the path to the input file as the first CLI argument"
    );

    process.exit(1);
  }

  const body = await readInputFile(inputPath);

  const entries = body
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .map((entry) => {
      return {
        ...entry,
        timestamp: new Date(entry.timestamp)
          .toLocaleString("en-GB", {
            timeZone: "UTC",
          })
          .replace(",", ""),
      };
    });

  const header = Object.keys(entries[0]);

  const headerString = header.join(",");
  const entryStrings = entries.map((entry) => Object.values(entry).join(","));

  const csv = [headerString, ...entryStrings].join("\n");

  await fs.writeFile("metrics.csv", csv, "utf-8");
}

run();
