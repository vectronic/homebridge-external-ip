"use strict";

var Service, Characteristic, detectedState, notDetectedState;
var request = require('request');

// Update UI immediately after sensor state change
var updateUI = false;

module.exports = function(homebridge) {

	// Service and Characteristic are from hap-nodejs
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerPlatform('homebridge-external-ip', 'ExternalIp', ExternalIpPlatform);
	homebridge.registerAccessory('homebridge-external-ip', 'ExternalIpContact', ExternalIpContactAccessory);
    
	detectedState = Characteristic.ContactSensorState.CONTACT_DETECTED; // Closed
	notDetectedState = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED; // Open

};

function ExternalIpPlatform(log, config) {

	this.log = log;
    
    this.sensor = config['sensor'] || {};
    
    // Allow retrieval of data from package.json
	this.pkginfo = require('pkginfo')(module);

}

ExternalIpPlatform.prototype = {

    accessories: function(callback) {

        var accessories = [];

		var sensorAccessory = new ExternalIpContactAccessory(this.pkginfo, this.log, this.sensor);
		accessories.push(sensorAccessory);

        callback(accessories);

    }
    
}

function ExternalIpContactAccessory(pkginfo, log, config) {

    this.log = log;
    this.pkginfo = pkginfo;

    this.expectedIp = config['expectedIp'] || '127.0.0.1';
    this.checkInterval = parseInt(config['interval']) || 300;
    
	// Initial state
	this.stateValue = notDetectedState;

	this._service = new Service.ContactSensor('External IP Check');
	
	// Default state is open, we want it to be closed
	this._service.getCharacteristic(Characteristic.ContactSensorState)
		.setValue(this.stateValue);
		
	this._service
		.getCharacteristic(Characteristic.ContactSensorState)
		.on('get', this.getState.bind(this));
		
	this._service.addCharacteristic(Characteristic.StatusFault);
	
	this.changeHandler = (function(newState) {
		
		this.log('[' + this.name + '] Setting sensor state set to ' + newState);
		this._service.getCharacteristic(Characteristic.ContactSensorState)
			.setValue(newState ? detectedState : notDetectedState);
			
		if (updateUI)
			this._service.getCharacteristic(Characteristic.ContactSensorState)
				.getValue();
		
	}).bind(this);

	this.doIpCheck();
	setInterval(this.doIpCheck.bind(this), this.checkInterval * 1000);

}

ExternalIpContactAccessory.prototype = {

	doIpCheck: function() {
		
		var self = this;
		var lastState = self.stateValue;

        request('http://ipinfo.io/ip', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body == self.expectedIp) {
                    self.stateValue = detectedState;
                }
                else {
                    self.log("expected: " + self.expectedIp + " != actual: " + body);
                    self.stateValue = notDetectedState;
                }
                self.setStatusFault(0);
            }
            else {
                self.log("Error from http://ipinfo.io/ip -> " + response.statusCode)
                self.stateValue = notDetectedState;
                self.setStatusFault(1);
            }
            if (self.stateValue != lastState) {
                self.changeHandler(self.stateValue);
            }
        })
	},
	
	setStatusFault: function(value) {
		
		this._service.setCharacteristic(Characteristic.StatusFault, value);	
		
	},

	identify: function(callback) {

		this.log('[' + this.name + '] Identify sensor requested');
		callback();

	},

	getState: function(callback) {

		this.log('[' + this.name + '] Getting sensor state, which is currently ' + this.stateValue);
		callback(null, this.stateValue);

	},

	getServices: function() {

		var informationService = new Service.AccessoryInformation();

		// Set plugin information
		informationService
			.setCharacteristic(Characteristic.Manufacturer, 'vectronic')
			.setCharacteristic(Characteristic.Model, 'External IP Contact Sensor')
			.setCharacteristic(Characteristic.SerialNumber, 'Version ' + module.exports.version);

		return [informationService, this._service];

	}

};