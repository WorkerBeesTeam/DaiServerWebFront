import {Component, ComponentFactoryResolver, ComponentRef, OnInit, ViewContainerRef} from '@angular/core';
import {AuthenticationService} from '../../authentication.service';
import {SchemeService} from '../scheme.service';
import {Device, Device_Item} from '../scheme';
import {MatDialog} from '@angular/material/dialog';
import {DeviceDetailDialogComponent} from '../manage/device-detail-dialog/device-detail-dialog.component';
import {DeviceItemDetailDialogComponent} from '../manage/device-item-detail-dialog/device-item-detail-dialog.component';
import {UIService} from '../../ui.service';
import {Structure_Type} from '../settings/settings';
import {ElementsComponent} from '../elements/elements.component';
import {NeedSidebar} from '../sidebar.service';

@Component({
    selector: 'app-manage-devices',
    templateUrl: './manage-devices.component.html',
    styleUrls: ['./manage-devices.component.css', '../manage/manage.component.css']
})
export class ManageDevicesComponent implements OnInit, NeedSidebar {
    isEditorModeEnabled = false;
    isAdmin: boolean;

    devices: Device[];

    constructor(
        private authService: AuthenticationService,
        private schemeService: SchemeService,
        private dialog: MatDialog,
        private ui: UIService,
        private resolver: ComponentFactoryResolver,
    ) {
        this.isAdmin = this.authService.isAdmin();
        this.devices = this.schemeService.scheme.device;
    }

    isDisabled(): boolean {
        return !this.schemeService.isSchemeConnected;
    }

    ngOnInit(): void {
    }

    editDevice(device: Device) {
        this.dialog.open(DeviceDetailDialogComponent, { data: device, width: '450px' })
            .afterClosed()
            .subscribe((newDevice: Device) => {});
    }

    removeDevice(device: Device) { // TODO: refactor remove methods below to use confirmationDialog().pipe() instead of nested subscribe
        this.ui.confirmationDialog()
            .subscribe((confirmation: boolean) => {
                if (!confirmation) return;

                this.schemeService.remove_structure(Structure_Type.ST_DEVICE, device)
                    .subscribe(() => {});
            });
    }

    editItem(item: Device_Item) {
        this.dialog.open(DeviceItemDetailDialogComponent, { data: item, width: '450px' })
            .afterClosed()
            .subscribe((updatedItem: Device_Item) => {});
    }

    removeItem(item: Device_Item) {
        this.ui.confirmationDialog()
            .subscribe((confirmation) => {
                if (!confirmation) return;

                this.schemeService.remove_structure(Structure_Type.ST_DEVICE_ITEM, item)
                    .subscribe(() => {});
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
            .subscribe((newItem: Device_Item) => {});
    }

    newDevice() {
        this.dialog.open(DeviceDetailDialogComponent, { width: '80%' })
            .afterClosed()
            .subscribe((device: Device) => {});
    }

    getSidebarWidget(viewContainerRef: ViewContainerRef): ComponentRef<any> {
        const factory = this.resolver.resolveComponentFactory(ElementsComponent);
        return viewContainerRef.createComponent(factory);
    }
}