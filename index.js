"use strict";

var request = require("requestretry");
var Service, Characteristic;


module.exports = function(homebridge) {

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerPlatform("homebridge-external-ip", "ExternalIp", ExternalIpPlatform);
};


function ExternalIpPlatform(log, config) {
    this.log = log;
    this.config = config;
}


ExternalIpPlatform.prototype.accessories = function (callback) {
    var accessories = [];
    accessories.push(new ExternalIpContactAccessory(this.log, this.config));
    callback(accessories);
};


function ExternalIpContactAccessory(log, config) {

    this.log = log;

    this.expectedIp = config["expectedIp"];
    if (!this.expectedIp) {
        throw new Error("Missing expectedIp!");
    }
    this.name = 'External IP';

    this.services = {
        AccessoryInformation: new Service.AccessoryInformation(),
        ContactSensor: new Service.ContactSensor(this.expectedIp)
    };

    this.services.AccessoryInformation
        .setCharacteristic(Characteristic.Manufacturer, "vectronic");
    this.services.AccessoryInformation
        .setCharacteristic(Characteristic.Model, "External IP Check");

    this.services.ContactSensor
        .getCharacteristic(Characteristic.ContactSensorState)
        .setValue(Characteristic.ContactSensorState.CONTACT_DETECTED);

    setInterval(this.doIpCheck.bind(this), (config["interval"] || 60) * 1000);
}


ExternalIpContactAccessory.prototype.doIpCheck = function () {

    var self = this;

    request("http://ipinfo.io/ip", function (error, response, body) {

        var state = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;

        if (!error && response.statusCode === 200) {
            if (body.trim().valueOf() === self.expectedIp.trim().valueOf()) {
                state = Characteristic.ContactSensorState.CONTACT_DETECTED;
            }
            else {
                self.log("expected: [" + self.expectedIp + "] != actual: [" + body.trim() + "]");
            }
        }
        else if (!error) {
            self.log("Error response http://ipinfo.io/ip -> " + response.statusCode);
        }
        else {
            self.log("Error from http://ipinfo.io/ip -> ");
            self.log(error);
        }
        self.services.ContactSensor
            .getCharacteristic(Characteristic.ContactSensorState)
            .updateValue(state);
    })
};


ExternalIpContactAccessory.prototype.getServices = function () {
    return [this.services.AccessoryInformation, this.services.ContactSensor];
};
