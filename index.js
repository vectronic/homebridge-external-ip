"use strict";

var Service, Characteristic, detectedState, notDetectedState;
var request = require('request');

// Update UI immediately after sensor state change
var updateUI = true;

module.exports = function (homebridge) {

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
}

ExternalIpPlatform.prototype.accessories = function (callback) {

    var accessories = [];

    accessories.push(new ExternalIpContactAccessory(this.log, this.sensor));

    callback(accessories);
};

function ExternalIpContactAccessory(log, config) {

    this.log = log;

    this.expectedIp = config['expectedIp'];

    if (!this.expectedIp) {
        throw new Error("Missing expectedIp!");
    }

    this.name = 'External IP Sensor';

    // Initial state
    this.stateValue = notDetectedState;

    this._service = new Service.ContactSensor('External IP Check');

    // Default state is open, we want it to be closed
    this._service
        .getCharacteristic(Characteristic.ContactSensorState)
        .setValue(this.stateValue);

    this._service
        .getCharacteristic(Characteristic.ContactSensorState)
        .on('get', this.getState.bind(this));

    this._service
        .addCharacteristic(Characteristic.StatusFault);

    this.changeHandler = (function (newState) {

        this.log('[' + this.name + '] Setting sensor state set to ' + newState);
        this._service
            .getCharacteristic(Characteristic.ContactSensorState)
            .setValue(newState ? detectedState : notDetectedState);

        if (updateUI) {
            this._service
                .getCharacteristic(Characteristic.ContactSensorState)
                .getValue();
        }

    }).bind(this);

    this.doIpCheck();
    setInterval(this.doIpCheck.bind(this), (parseInt(config['interval']) || 300) * 1000);
}

ExternalIpContactAccessory.prototype.doIpCheck = function () {

    var self = this;
    var lastState = self.stateValue;

    request('http://ipinfo.io/ip', function (error, response, body) {
        if (!error && response.statusCode === 200) {
            if (body.trim().valueOf() === self.expectedIp.trim().valueOf()) {
                self.stateValue = detectedState;
            }
            else {
                self.log("expected: [" + self.expectedIp + "] != actual: [" + body + "]");
                self.stateValue = notDetectedState;
            }
            self.setStatusFault(0);
        }
        else {
            self.log("Error from http://ipinfo.io/ip -> ");
            self.log(error);
            self.stateValue = notDetectedState;
            self.setStatusFault(1);
        }
        if (self.stateValue !== lastState) {
            self.changeHandler(self.stateValue);
        }
    })
};

ExternalIpContactAccessory.prototype.setStatusFault = function (value) {

    this._service.setCharacteristic(Characteristic.StatusFault, value);
};

ExternalIpContactAccessory.prototype.getState = function (callback) {

    this.log('[' + this.name + '] Sensor state: ' + this.stateValue);
    callback(null, this.stateValue);
};

ExternalIpContactAccessory.prototype.getServices = function () {

    var informationService = new Service.AccessoryInformation();

    // Set plugin information
    informationService
        .setCharacteristic(Characteristic.Manufacturer, 'vectronic')
        .setCharacteristic(Characteristic.Model, 'External IP Contact Sensor')
        .setCharacteristic(Characteristic.SerialNumber, '');

    return [informationService, this._service];
};