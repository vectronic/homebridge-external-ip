import type { PlatformAccessory, Service } from 'homebridge';

import type { ExternalIpPlatform } from './platform.js';

export class ExternalIpAccessory {
  private contactSensorService: Service;
  private readonly expectedIp: string;
  private readonly interval: number;

  constructor(
    private readonly platform: ExternalIpPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.expectedIp = (this.platform.config.expectedIp as string).trim();
    this.interval = (this.platform.config.interval as number | undefined) || 60;

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'vectronic')
      .setCharacteristic(this.platform.Characteristic.Model, 'External IP Check')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'external-ip-001');

    this.contactSensorService = this.accessory.getService(this.platform.Service.ContactSensor)
      || this.accessory.addService(this.platform.Service.ContactSensor, this.expectedIp);

    this.contactSensorService.setCharacteristic(
      this.platform.Characteristic.Name,
      this.expectedIp,
    );

    this.contactSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
      .onGet(() => this.contactSensorService
        .getCharacteristic(this.platform.Characteristic.ContactSensorState).value
        ?? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);

    this.contactSensorService.updateCharacteristic(
      this.platform.Characteristic.ContactSensorState,
      this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED,
    );

    this.doIpCheck();
    setInterval(() => this.doIpCheck(), this.interval * 1000);
  }

  private async doIpCheck(): Promise<void> {
    try {
      const response = await fetch('http://ipinfo.io/ip');
      if (!response.ok) {
        this.platform.log.error('Error response from http://ipinfo.io/ip ->', response.status);
        this.updateState(false);
        return;
      }

      const body = await response.text();
      const actualIp = body.trim();

      if (actualIp === this.expectedIp) {
        this.updateState(true);
      } else {
        this.platform.log.info(`expected: [${this.expectedIp}] != actual: [${actualIp}]`);
        this.updateState(false);
      }
    } catch (error) {
      this.platform.log.error('Error from http://ipinfo.io/ip ->', String(error));
      this.updateState(false);
    }
  }

  private updateState(matched: boolean): void {
    const state = matched
      ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
      : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;

    this.contactSensorService.updateCharacteristic(
      this.platform.Characteristic.ContactSensorState,
      state,
    );
  }
}
