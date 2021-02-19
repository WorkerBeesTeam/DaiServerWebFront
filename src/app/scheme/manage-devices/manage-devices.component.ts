import {Component, OnInit} from '@angular/core';
import {AuthenticationService} from '../../authentication.service';
import {SchemeService} from '../scheme.service';
import {Device, Device_Item} from '../scheme';
import {MatDialog} from '@angular/material/dialog';
import {DeviceDetailDialogComponent} from '../manage/device-detail-dialog/device-detail-dialog.component';
import {DeviceItemDetailDialogComponent} from '../manage/device-item-detail-dialog/device-item-detail-dialog.component';
import {UIService} from '../../ui.service';

@Component({
    selector: 'app-manage-devices',
    templateUrl: './manage-devices.component.html',
    styleUrls: ['./manage-devices.component.css', '../manage/manage.component.css']
})
export class ManageDevicesComponent implements OnInit {
    isEditorModeEnabled = false;
    isAdmin: boolean;

    devices: Device[];

    constructor(
        private authService: AuthenticationService,
        private schemeService: SchemeService,
        private dialog: MatDialog,
        private ui: UIService,
    ) {
        this.isAdmin = this.authService.isAdmin();
        this.devices = this.schemeService.scheme.device;
    }

    ngOnInit(): void {
    }

    editDevice(device: Device) {
        this.dialog.open(DeviceDetailDialogComponent, { data: device, width: '450px' })
            .afterClosed()
            .subscribe((newDevice: Device) => {
                // TODO: update list if needed
            });
    }

    removeDevice(device: Device) {
        this.ui.confirmationDialog()
            .subscribe((confirmation: boolean) => {
                if (!confirmation) return;

                this.schemeService.modify_structure('device', [{ id: device.id }])
                    .subscribe(() => {
                        // TODO: update
                    });
            });
    }

    editItem(item: Device_Item) {
        this.dialog.open(DeviceItemDetailDialogComponent, { data: item, width: '450px' })
            .afterClosed()
            .subscribe((updatedItem: Device_Item) => {
                // TODO: update list if needed
            });
    }

    removeItem(item: Device_Item) {
        this.ui.confirmationDialog()
            .subscribe((confirmation) => {
                if (!confirmation) return;

                this.schemeService.modify_structure('device_item', [{ id: item.id }])
                    .subscribe(() => {
                        // TODO: update
                    });
            });
    }

    newItem(device: Device) {
        this.dialog.open(DeviceItemDetailDialogComponent, {
            width: '80%',
            data: {
                device_id: device.id,
            },
        })
            .afterClosed()
            .subscribe((newItem: Device_Item) => {
                // TODO: update list if needed
            });
    }

    newDevice() {
        this.dialog.open(DeviceDetailDialogComponent, { width: '80%' })
            .afterClosed()
            .subscribe((device: Device) => {
                // TODO: update list if needed
            });
    }
}
