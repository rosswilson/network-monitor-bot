# Network Monitor Bot

<img src="./docs/output.png" width="400" />

A simple bot that periodically hits the admin panel for my [TalkTalk](http://talktalk.co.uk/)
SG4K10001400t VDSL router and scrapes the broadband WAN metrics.

Those metrics are logged to a file as seperate rows of JSON. In the future I'd like to
ingest these metrics and visualise them in Grafana.

## Requirements

The only requirement of this application is Yarn. All other can be installed with:

`yarn install`

## Running The Application Locally

Run the script from a computer on your local network:

`ADMIN_PASSWORD=YOUR_ROUTER_ADMIN_PASSWORD_HERE yarn start`

## Archived Metrics

Every time the script runs a new line is appended to a `metrics.log` file in the current directory.

You could parse this file however you want, perhaps using the excelent [jq](https://stedolan.github.io/jq/) utility.

```json
{"systemUptime":"14h32m52s","status":"UP","connectionTime":"05h33m36s","linkStatus":"UP","standard":"VDSL2 (G_993_2_ANNEX_ B) ","lineEncoding":"DMT","linkEncapsulation":"ATM (G_992_3_ANNEX_ K_ATM)","actualRateDown":"47984","actualRateUp":"20000","maximumRateDown":"54429","maximumRateUp":"20000","noiseMarginDown":"0.00","noiseMarginUp":"6.00","attenuationDown":"16.50","attenuationUp":"0.00","powerDown":"13.10","powerUp":"6.80","timestamp":1597272076429}
{"systemUptime":"14h33m04s","status":"DOWN","connectionTime":"05h33m48s","linkStatus":"UP","standard":"VDSL2 (G_993_2_ANNEX_ B) ","lineEncoding":"DMT","linkEncapsulation":"ATM (G_992_3_ANNEX_ K_ATM)","actualRateDown":"47984","actualRateUp":"20000","maximumRateDown":"54429","maximumRateUp":"20000","noiseMarginDown":"0.00","noiseMarginUp":"6.00","attenuationDown":"16.50","attenuationUp":"0.00","powerDown":"13.10","powerUp":"6.80","timestamp":1597272087700}
{"systemUptime":"14h33m21s","status":"UP","connectionTime":"05h34m05s","linkStatus":"UP","standard":"VDSL2 (G_993_2_ANNEX_ B) ","lineEncoding":"DMT","linkEncapsulation":"ATM (G_992_3_ANNEX_ K_ATM)","actualRateDown":"47984","actualRateUp":"20000","maximumRateDown":"54429","maximumRateUp":"20000","noiseMarginDown":"0.00","noiseMarginUp":"6.00","attenuationDown":"16.50","attenuationUp":"0.00","powerDown":"13.10","powerUp":"6.80","timestamp":1597272105107}
```

## Deployment

I have the script running periodically using systemd scheduled events. I'll include
the config files here soon.

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).
