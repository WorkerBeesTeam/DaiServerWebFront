import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import { MediaMatcher} from '@angular/cdk/layout';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';

import { ISubscription } from 'rxjs/Subscription';

import { SchemeService } from './scheme.service';
import { Connection_State } from '../user';
import { ControlService, WebSockCmd } from './control.service';
import { AuthenticationService } from '../authentication.service';
import { TranslateService } from '@ngx-translate/core';
import { FavService } from '../fav.service';

interface NavLink {
  link: string;
  query?: any;
  text: string;
  icon: string;
}

@Component({
  selector: 'app-scheme',
  templateUrl: './scheme.component.html',
  styleUrls: ['./scheme.component.css'],
})
export class SchemeComponent implements OnInit, OnDestroy {
  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  fillerNav: NavLink[] = [];

  status_checked = false;
  connection_str = ' '; // SchemeComponent.getConnectionString(false);

  connect_state: Connection_State = Connection_State.CS_DISCONNECTED;
  private mod_state: boolean;
  private loses_state: boolean;

  get connected(): boolean {
    return this.connect_state !== Connection_State.CS_DISCONNECTED;
  }

  private page_reload_dialog_ref: MatDialogRef<PageReloadDialogComponent> = undefined;

  dt_offset = 0;
  dt_tz_name = '';
  dt_interval: any;
  dt_text = '';

  private bytes_sub: ISubscription;
  private opened_sub: ISubscription;

  isFav = false;

  private getConnectionString(connected: boolean): string {
    return connected ? undefined : this.translate.instant('CONNECTION_PROBLEM');
  }

  get status_class(): string {
    if (this.connection_str !== undefined && this.connection_str !== ' ') {
      return 'status_fail';
    }

    if (!this.status_checked) {
      return 'status_check';
    }

    if (this.mod_state) {
      return 'status_modified';
    }

    switch (this.connect_state) {
      case Connection_State.CS_SERVER_DOWN:
        return 'status_server_down';
      case Connection_State.CS_DISCONNECTED:
        return 'status_bad';
      case Connection_State.CS_CONNECTED:
        return 'status_ok';
      case Connection_State.CS_CONNECTED_MODIFIED:
        return 'status_modified';
      case Connection_State.CS_DISCONNECTED_JUST_NOW:
        return 'status_bad_just';
      case Connection_State.CS_CONNECTED_JUST_NOW:
        return 'status_sync';
      case Connection_State.CS_CONNECTED_SYNC_TIMEOUT:
        return 'status_ok';
    }
  }

  get status_desc(): string {
    if (this.connection_str !== undefined && this.connection_str !== ' ') {
      return this.connection_str;
    }

    let result = '';

    if (this.mod_state) {
      result += this.translate.instant('MODIFIED') + '. ';
    }


    if (this.loses_state) {
      result += this.translate.instant('WITH_LOSS');
    }

    if (this.status_checked) {
      switch (this.connect_state) {
        case Connection_State.CS_SERVER_DOWN:
          return this.translate.instant('SERVER_DOWN');
        case Connection_State.CS_DISCONNECTED:
          return result + this.translate.instant('OFFLINE');
        case Connection_State.CS_CONNECTED:
          return result + this.translate.instant('ONLINE');
        case Connection_State.CS_CONNECTED_MODIFIED:
          return result + this.translate.instant('MODIFIED');
        case Connection_State.CS_DISCONNECTED_JUST_NOW:
          return result + this.translate.instant('DISCONNECTED_JUST_NOW');
        case Connection_State.CS_CONNECTED_JUST_NOW:
          return result + this.translate.instant('CONNECTED_JUST_NOW');
        case Connection_State.CS_CONNECTED_SYNC_TIMEOUT:
          return result + this.translate.instant('CONNECTED_SYNC_TIMEOUT');
      }
    }
    return this.translate.instant('WAIT') + '...';
  }

  constructor(
    public translate: TranslateService,
    public schemeService: SchemeService,
    private route: ActivatedRoute,
    private controlService: ControlService,
    private authService: AuthenticationService,
    private dialog: MatDialog,
    private router: Router,
    changeDetectorRef: ChangeDetectorRef, media: MediaMatcher,
    private favService: FavService,
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    // this.mobileQuery.addListener(this._mobileQueryListener);
  }

  addMenu(name: string, icon: string): void {
    if (this.authService.checkPermission('menu_' + name))
      this.fillerNav.push({link: name, text: this.translate.instant('NAVIGATION_TAB.' + name.toUpperCase()), icon: icon});
  }

  ngOnInit() {
    const isAdmin = this.authService.isAdmin();
    const isFullAccess = this.authService.isFullAccess();

    this.addMenu('detail', 'perm_device_information');
    this.addMenu('elements', 'build');
    this.addMenu('log_event', 'event_note');
    this.addMenu('log_value', 'event_note');
    this.addMenu('structure', 'settings');
    this.addMenu('reports', 'show_chart');
    this.addMenu('help', 'help');

    this.getSchemeInfo();

    this.isFav = this.favService.isFav(this.schemeService.scheme.name);
  }

  ngOnDestroy() {
    // this.mobileQuery.removeListener(this._mobileQueryListener);

    this.opened_sub.unsubscribe();
    this.bytes_sub.unsubscribe();
    this.controlService.close();
    this.schemeService.clear();
  }

  clearTime(): void {
    if (this.dt_interval) {
      clearInterval(this.dt_interval);
      this.dt_text = '';
    }
  }

  getSchemeInfo(): void {
    this.schemeService.scheme.conn.subscribe(v => {
      const [connState, modState, losesState] = this.controlService.parseConnectNumber(v);
      this.connect_state = connState as Connection_State;
      this.mod_state = modState as boolean;
      this.loses_state = losesState as boolean;
      console.log(this.connect_state);
    }).unsubscribe();

    this.bytes_sub = this.controlService.byte_msg.subscribe(msg => {

      if (msg.cmd === WebSockCmd.WS_CONNECTION_STATE) {
        if (msg.data === undefined) {
          console.log('ConnectInfo without data');
          return;
        }

        if (msg.scheme_id === 0) {
          console.log('SCHEME_ID == 0');
          this.connect_state = Connection_State.CS_SERVER_DOWN;
          return;
        }

        const [connState, modState, losesState] = this.controlService.parseConnectState(msg.data);


        /* get connecton state */
        this.connect_state = connState;
        this.mod_state = modState;
        this.loses_state = losesState;

        if (!this.status_checked) {
          this.status_checked = true;
        }
      } else if (msg.cmd === WebSockCmd.WS_STRUCT_MODIFY) {
        const view = new Uint8Array(msg.data);
        const structure_type = view[8];
        switch (structure_type) {
          case 23: // STRUCT_TYPE_DEVICE_ITEM_VALUES
          case 24: // STRUCT_TYPE_GROUP_MODE
          case 25: // STRUCT_TYPE_GROUP_STATUS
          case 26: // STRUCT_TYPE_GROUP_PARAM_VALUE
            return;
        }

        this.connect_state = Connection_State.CS_CONNECTED_MODIFIED;

        if (!this.page_reload_dialog_ref) {
          this.page_reload_dialog_ref = this.dialog.open(PageReloadDialogComponent, {width: '80%', });
          this.page_reload_dialog_ref.afterClosed().subscribe(result => {
            if (result) {
              window.location.reload();
            }
            this.page_reload_dialog_ref = undefined;
          });
        }
      } else if (msg.cmd === WebSockCmd.WS_TIME_INFO) {
        console.log(msg);

        const info = this.controlService.parseTimeInfo(msg.data);

        if (info.time && info.time_zone) {
          this.dt_offset = new Date().getTime() - info.time;
          this.dt_tz_name = info.time_zone.replace(', стандартное время', '');
          if (!this.dt_interval) {
            const gen_time_string = () => {
              const dt = new Date();
              dt.setTime(dt.getTime() - this.dt_offset);

              const months = this.translate.instant('MONTHS');
              const t_num = (num: number): string => {
                return (num < 10 ? '0' : '') + num.toString();
              };

              this.dt_text = t_num(dt.getHours()) + ':' + t_num(dt.getMinutes()) + ':' + t_num(dt.getSeconds()) + ', ' +
                t_num(dt.getDate()) + ' ' + (months.length === 12 ? months[dt.getMonth()] : dt.getMonth()) + ' ' + dt.getFullYear();

            };
            gen_time_string();
            this.dt_interval = setInterval(gen_time_string, 1000);
          }
        }
      }
    });

    this.opened_sub = this.controlService.opened.subscribe(opened => {
      this.connection_str = this.getConnectionString(opened);

      if (opened) {
        this.controlService.getConnectInfo();
      } else {
        this.clearTime();
        this.connect_state = Connection_State.CS_DISCONNECTED;
      }
    });

    this.controlService.open();
  }

  restart(): void {
    this.controlService.restart();
  }

  closeMenu() {
    const el: HTMLInputElement = <HTMLInputElement>document.getElementById('localnav-menustate');
    el.checked = false;
  }

  fav() {
    this.favService.addToFav(this.schemeService.scheme.name, this.schemeService.scheme.title);
    this.isFav = this.favService.isFav(this.schemeService.scheme.name);
  }

  unfav() {
    this.favService.removeFromFav(this.schemeService.scheme.name);
    this.isFav = this.favService.isFav(this.schemeService.scheme.name);
  }
}

@Component({
  templateUrl: './page-reload-dialog.component.html',
})
export class PageReloadDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PageReloadDialogComponent>
  ) {
  }
}
