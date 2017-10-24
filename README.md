# homebridge-external-ip
A contact sensor plugin for homebridge (https://github.com/nfarina/homebridge) which allows checking of public IP.

# Installation
1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin.
3. Update your config.json configuration file

# Configuration
Example config.json entry:
```
    "platforms": [
		{
			"platform": "ExternalIp",
			"sensor": 
			{
                "expectedIp": "x.x.x.x",
                "interval": 120
            }
		}
	]
```