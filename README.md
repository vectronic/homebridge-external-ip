# homebridge-external-ip
> A [Homebridge](https://github.com/nfarina/homebridge) plugin exposing a contact sensor state based on external IP

># Installation
1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin: `npm install -g homebridge-external-ip`
3. Update your `config.json` configuration file

# Configuration
Example `config.json` entry:

```
    "platforms": [
		{
			"platform": "ExternalIp",
            "expectedIp": "x.x.x.x",
            "interval": 120
		}
	]
```
Where:

* `expectedIp` is the expected external IP
* `interval` is the polling interval to check the current external IP

# Help etc.

If you have a query or problem, raise an issue in GitHub, or better yet submit a PR!

