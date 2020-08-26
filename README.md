# Network Monitor Bot

<img src="./docs/output.png" width="400" />

A simple bot that periodically hits the admin panel for my [TalkTalk](http://talktalk.co.uk/)
Sagemcom F@ST 5364 VDSL router (software version `SG4K10002816t`) and fetches various device and WAN metrics.

Those metrics are logged to a file as seperate rows of JSON. In the future I'd like to
ingest these metrics and visualise them in Grafana.

## Requirements

The only requirements of this application are Node.js and Yarn. All others can be installed with:

`yarn install`

## Running The Application Locally

Run the script from a computer on your local network:

`ADMIN_PASSWORD=YOUR_ROUTER_ADMIN_PASSWORD_HERE yarn start`

## Archived Metrics

For every script invocation a new line is appended to a `metrics.log` file in the current directory. A sample of the JSON
properties can be found below, for readability it has been formatted onto multiple lines.

You could parse this file however you want, perhaps using the excellent [jq](https://stedolan.github.io/jq/) utility.

```json
{
  "systemUptime": 11764, // seconds of uptime
  "status": "UP",
  "connectionTime": 5879, // seconds since the WAN connection was established
  "currentProfile": "8A",
  "downstreamAttenuation": 16.7, // dB
  "downstreamMaxBitRate": 59282, // Kbps
  "downstreamNoiseMargin": 3.1, // dB
  "downstreamPower": 13.1, // dBm
  "idDSLAM": "BDCM:0xc01c",
  "linkStatus": "UP",
  "bytesSent": "652664415", // bytes
  "bytesReceived": "47157240", // bytes
  "errorsReceived": 1477,
  "errorsSent": 442,
  "totalErroredSecs": 124,
  "totalSeverelyErroredSecs": 59,
  "totalUnavailableSeconds": 0,
  "totalLinkRetrain": 2,
  "totalLossOfFraming": 9,
  "upstreamAttenuation": 0, // dB
  "upstreamMaxBitRate": 20000, // Kbps
  "upstreamNoiseMargin": 8.4, // dB
  "upstreamPower": 6.9, // dBm
  "vectoringState": "DISABLED",
  "downstreamCurrRate": 60520, // Kbps
  "linkEncapsulationUsed": "G_992_3_ANNEX_K_ATM",
  "upstreamCurrRate": 20000, // Kbps
  "timestamp": 1598464656363 // milliseconds
}
```

## Deployment

I have the script running periodically using a `systemd` timer. The following config files make that happen.

[Healthchecks.io](https://healthchecks.io) is a nice way to be notified if scheduled tasks stop running. I
fire a request to their ping endpoint using `curl` each time the bot runs. If it stops reporting in for more than an hour
I get sent an email.

```
# /etc/systemd/system/network-monitor-bot.service

[Unit]
Description=A bot to periodically log my TalkTalk router metrics

[Service]
Type=oneshot
User=pi
WorkingDirectory=/home/pi/network-monitor-bot
ExecStart=/usr/bin/yarn start
ExecStartPost=curl -fsS --retry 3 https://hc-ping.com/PING_ID_GOES_HERE
```

```
# /etc/systemd/system/network-monitor-bot.timer

[Unit]
Description=Run network-monitor-bot hourly

[Timer]
OnCalendar=*:15,45
RandomizedDelaySec=60

[Install]
WantedBy=timers.target
```

```
# /etc/systemd/system/network-monitor-bot.service.d/override.conf

[Service]
Environment="NATIVE_CHROMIUM=true"
Environment="ADMIN_PASSWORD=YOUR_ROUTER_ADMIN_PASSWORD_HERE"
```

Don't forget to reload `systemd` after creating these config files:

`sudo systemctl daemon-reload`

# Convert to CSV

Run `node ./src/toCsv.js ./metrics.log` to convert the JSON-per-line metrics file to CSV. This
can then be imported into Excel or Google Sheets to graph.

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).
