import { Component, OnInit } from '@angular/core';
import {HouseService} from '../../house/house.service';
import {DeviceItem} from '../../house/house';
import {ControlService} from '../../house/control.service';

@Component({
  selector: 'app-wifi',
  templateUrl: './wifi.component.html',
  styleUrls: ['./wifi.component.css']
})
export class WifiComponent implements OnInit {
  wifi_pwd: DeviceItem;
  wifi_ssid: DeviceItem;

  constructor(
    private houseService: HouseService,
    private controlService: ControlService,
  ) { }

  ngOnInit() {
    const network = this.houseService.house.sections[0].groups.find(g => g.type.name === 'network').items;

    this.wifi_pwd = network.find(i => i.type.name === 'wifi_pwd');
    this.wifi_ssid = network.find(i => i.type.name === 'wifi_ssid');
  }

  save(ssid, pwd) {
    console.log(ssid);
    console.log(pwd);
    this.controlService.writeToDevItem(this.wifi_ssid.id, ssid);
    this.controlService.writeToDevItem(this.wifi_pwd.id, pwd);
  }
}