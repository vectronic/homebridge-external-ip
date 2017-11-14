"use strict";

var Service, Characteristic, detectedState, notDetectedState;
var request = require('requestretry');

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

    this._service = new Service.ContactSensor('External IP Check');

    // Default state is closed, we will detect if it changes
    this.stateValue = detectedState;
    this._service
        .getCharacteristic(Characteristic.ContactSensorState)
        .setValue(this.stateValue);

    this._service
        .getCharacteristic(Characteristic.ContactSensorState)
        .on('get', this.getState.bind(this));

    this.changeHandler = (function (newState) {

        this.log('[' + this.name + '] Setting sensor state set to ' + newState);
        this._service
            .getCharacteristic(Characteristic.ContactSensorState)
            .setValue(newState ? detectedState : notDetectedState);
        this._service
            .getCharacteristic(Characteristic.ContactSensorState)
            .getValue();

    }).bind(this);

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
                self.log("expected: [" + self.expectedIp + "] != actual: [" + body.trim() + "]");
                self.stateValue = notDetectedState;
            }
        }
        else if (!error) {
            self.log("Error response http://ipinfo.io/ip -> " + response.statusCode);
            self.stateValue = notDetectedState;
        }
        else {
            self.log("Error from http://ipinfo.io/ip -> ");
            self.log(error);
            self.stateValue = notDetectedState;
        }
        if (self.stateValue !== lastState) {
            self.changeHandler(self.stateValue);
        }
    })
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