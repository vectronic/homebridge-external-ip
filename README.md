# homebridge-external-ip
> A [Homebridge](https://github.com/homebridge/homebridge) plugin exposing a contact sensor state based on external IP

## Installation
1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin: `npm install -g homebridge-external-ip`
3. Update your `config.json` configuration file

## Configuration
Example `config.json` entry:

```json
"platforms": [
    {
        "platform": "ExternalIp",
        "expectedIp": "x.x.x.x",
        "interval": 120
    }
]
```
Where:

* `expectedIp` is the expected external IP address. Contact sensor shows "detected" when the current external IP matches this value.
* `interval` is the polling interval in seconds to check the current external IP (default: 60).

## Help

If you have a query or problem, raise an issue in GitHub, or better yet submit a PR!
