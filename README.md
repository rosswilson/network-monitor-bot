# Network Monitor Bot

<img src="./docs/output.png" width="400" />

A simple bot that periodically hits the admin panel for my [TalkTalk](http://talktalk.co.uk/)
SG4K10001400t VDSL router and scrapes the broadband WAN metrics.

Those metrics are logged to a file as seperate rows of JSON. In the future I'd like to
ingest these metrics and visualise them in Grafana.

## Requirements

The only requirement of this application is Yarn. All other
dependencies (including the AWS SDK for Node.js) can be installed with:

`yarn install`

## Running The Application Locally

Run the script from a computer on your local network:

`ADMIN_PASSWORD=YOUR_PASSWORD_HERE yarn start`

## Deployment

I have the script running periodically using systemd scheduled events. I'll include
the config files here soon.

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).
