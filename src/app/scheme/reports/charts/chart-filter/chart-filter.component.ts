import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {FormControl} from '@angular/forms';
import * as moment from 'moment';
import {Chart_Info_Interface, Chart_Type, ChartFilter, Select_Item_Iface} from '../chart-types';
import {Chart, Device_Item_Group, DIG_Param, DIG_Param_Value_Type, Section} from '../../../scheme';
import {SchemeService} from '../../../scheme.service';
import {ColorPickerDialog} from '../color-picker-dialog/color-picker-dialog';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter} from '@angular/material-moment-adapter';

function parseDate(date: FormControl, time: string): number {
    let time_arr = time.split(':');
    let date_from = date.value.toDate();
    date_from.setHours(+time_arr[0]);
    date_from.setMinutes(+time_arr[1]);
    date_from.setSeconds(+time_arr[2]);
    return date_from.getTime();
}

@Component({
    selector: 'app-chart-filter',
    templateUrl: './chart-filter.component.html',
    styleUrls: ['./chart-filter.component.css'],
    providers: [
        // The locale would typically be provided on the root module of your application. We do it at
        // the component level here, due to limitations of our example generation script.
        {provide: MAT_DATE_LOCALE, useValue: 'ru-RU'},

        // `MomentDateAdapter` and `MAT_MOMENT_DATE_FORMATS` can be automatically provided by importing
        // `MatMomentDateModule` in your applications root module. We provide it at the component level
        // here, due to limitations of our example generation script.
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
        },
        {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
    ]
})
export class ChartFilterComponent implements OnInit {
    chartType = Chart_Type;

    @Input() charts: Chart_Info_Interface[];
    @Input() params: ChartFilter;
    @Output() paramsChange: EventEmitter<ChartFilter> = new EventEmitter();

    // ngModels
    charts_type: Chart_Type = Chart_Type.CT_USER;
    date_from = new FormControl(moment());
    time_from = '00:00:00';
    date_to = new FormControl(moment());
    time_to = '23:59:59';
    user_chart: Chart;
    user_charts: Chart[] = [];
    itemList = [];
    selectedItems = [];
    settings: any = {};

    paramList: Select_Item_Iface[] = [];
    paramSelected: Select_Item_Iface[] = [];
    paramSettings: any = {};

    data_part_size = 100000;

    constructor(private schemeService: SchemeService) {
    }

    ngOnInit(): void {
        this.schemeService.get_charts().subscribe(charts => { // TODO: Assignee:ByMsx May be I have to move it out and provide charts as @Input()
            this.user_charts = charts;
            if (!this.user_charts.length) {
                this.charts_type = Chart_Type.CT_DIG_TYPE;
            }

            this.OnChartsType();
            this.buildChart(); // TODO: Assignee:ByMsx do I need emit event
        });
    }

    OnChartsType(user_chart: Chart = undefined): void {
        if (user_chart) {
            this.user_chart = {...user_chart};
        } else {
            this.user_chart = {id: 0, name: ''} as Chart;
        }

        this.selectedItems = [];
        this.settings = {
            text: '',
            selectAllText: 'Выбрать все',
            // unSelectAllText: 'Снять все',
            classes: 'chart-type-data ctd-items',
            enableSearchFilter: true,
            labelKey: 'title',
            singleSelection: false,
            groupBy: ''
        };

        this.paramSelected = [];
        this.paramSettings = {
            text: '',
            selectAllText: 'Выбрать все',
            classes: 'chart-type-data custom-class',
            enableSearchFilter: true,
            labelKey: 'title',
            groupBy: 'category'
        };

        switch (this.charts_type) {
            case Chart_Type.CT_USER:
                this.itemList = this.user_charts;
                if (this.itemList.length) {
                    this.selectedItems.push(this.itemList[0]);
                }
                this.settings.text = 'Выберите график';
                this.settings.singleSelection = true;
                this.settings.labelKey = 'name';

                this.paramList = null;

                break;
            case Chart_Type.CT_DIG_TYPE:
                this.itemList = this.schemeService.scheme.dig_type;
                if (this.itemList.length) {
                    this.selectedItems.push(this.itemList[0]);
                    this.onItemSelect(this.selectedItems[0]);
                }
                this.settings.text = 'Выберите тип группы';
                this.settings.singleSelection = true;

                this.paramSettings.text = 'Выберите тип уставки';
                break;
            case Chart_Type.CT_DEVICE_ITEM_TYPE:
                this.itemList = this.schemeService.scheme.device_item_type;
                this.settings.text = 'Выберите тип элемента';

                this.paramList = this.getParamTypeList();
                this.paramSettings.text = 'Выберите тип уставки';
                break;
            case Chart_Type.CT_DEVICE_ITEM:
                this.itemList = this.getDevItemList();
                this.settings.text = 'Выберите элемент';
                this.settings.groupBy = 'category';

                this.paramList = this.getParamList();
                this.paramSettings.text = 'Выберите уставку';
                break;
            default:
                break;
        }
    }

    onItemSelect(item: any): void {
        if (this.charts_type === Chart_Type.CT_DIG_TYPE) {
            const accepted_param_type_ids = this.schemeService.scheme.dig_param_type
                .filter(param_type => param_type.group_type_id === item.id)
                .map(param_type => param_type.id);

            this.paramSelected = [];
            this.paramList = this.getParamTypeList().filter((param_type: Select_Item_Iface) => {
                return accepted_param_type_ids.includes(param_type.id);
            });
        }
    }

    getDevItemList(): Select_Item_Iface[] {
        let devItemList = [];
        for (const sct of this.schemeService.scheme.section) {
            for (const group of sct.groups) {
                const po = this.getPrefixObj(sct, group);

                for (const item of group.items) {
                    const title = po.prefix + (item.name || item.type.title);
                    devItemList.push({id: item.id, title, category: po.category});
                }
            }
        }

        return devItemList;
    }

    getParamList(): Select_Item_Iface[] {
        let paramList: Select_Item_Iface[] = [];

        let add_param = (p: DIG_Param, category: string = '') => {
            if (p.childs && p.childs.length) {
                const new_category = category + ' - ' + p.param.title;
                for (const p1 of p.childs) {
                    add_param(p1, new_category);
                }
            } else {
                paramList.push({id: p.id, title: p.param.title, category});
            }
        };

        for (const sct of this.schemeService.scheme.section) {
            for (const group of sct.groups) {
                const po = this.getPrefixObj(sct, group);

                for (const prm of group.params) {
                    add_param(prm, po.category + po.prefix);
                }
            }
        }

        return paramList;
    }

    getParamTypeList(): Select_Item_Iface[] {
        const paramList: Select_Item_Iface[] = [];
        const param_types = this.schemeService.scheme.dig_param_type;
        for (const pt of param_types) {
            if (pt.value_type >= DIG_Param_Value_Type.VT_RANGE
                || pt.value_type <= DIG_Param_Value_Type.VT_UNKNOWN) {
                continue;
            }

            let category = '?';
            for (const dig_type of this.schemeService.scheme.dig_type) {
                if (dig_type.id === pt.group_type_id) {
                    category = dig_type.title;
                    break;
                }
            }

            let title = pt.title;
            if (pt.parent_id) {
                for (const p_pt of param_types) {
                    if (p_pt.id === pt.parent_id) {
                        title = p_pt.title + ' - ' + title;
                        break;
                    }
                }
            }

            paramList.push({id: pt.id, title, category});
        }

        return paramList;
    }

    getPrefixObj(sct: Section, group: Device_Item_Group): any {
        let prefix = '';
        let category;
        if (this.schemeService.scheme.section.length > 1) {
            category = sct.name;
            prefix = (group.title || group.type.title) + ' - ';
        } else {
            category = group.title || group.type.title;
        }
        return {prefix, category};
    }

    edit_user_chart(): void {
        const user_chart = this.selectedItems[0];

        this.charts_type = Chart_Type.CT_DEVICE_ITEM;
        this.OnChartsType(user_chart);

        this.selectedItems = this.itemList.filter(item => {
            for (const it of user_chart.items) {
                if (item.id === it.item_id) {
                    return true;
                }
            }
            return false;
        });

        this.paramSelected = this.paramList.filter(item => {
            for (const it of user_chart.items) {
                if (item.id === it.param_id) {
                    return true;
                }
            }
            return false;
        });
    }

    save_user_chart(): void {
        if (!this.user_chart.name.length) {
            return;
        }

        const chart = this.charts[0];
        const get_color = (item_id: number, param_id: number): string => {
            for (const dataset of chart.data.datasets) {
                if (item_id !== null) {
                    if (dataset.dev_item && dataset.dev_item.id === item_id) {
                        return ColorPickerDialog.rgba2hex(dataset.pointBorderColor);
                    }
                } else if (dataset.param && dataset.param.id === param_id) {
                    return ColorPickerDialog.rgba2hex(dataset.pointBorderColor);
                }
            }
            return '';
        };

        let user_chart = new Chart;
        user_chart.id = this.user_chart.id;
        user_chart.name = this.user_chart.name;
        user_chart.items = [];

        for (const item of this.selectedItems) {
            const chart_item = {color: get_color(item.id, null), item_id: item.id, param_id: null};
            user_chart.items.push(chart_item);
        }

        for (const item of this.paramSelected) {
            const chart_item = {color: get_color(null, item.id), item_id: null, param_id: item.id};
            user_chart.items.push(chart_item);
        }

        this.schemeService.save_chart(user_chart).subscribe(new_chart => {
            for (let chart of this.user_charts) {
                if (chart.id === new_chart.id) {
                    chart.name = new_chart.name;
                    chart.items = new_chart.items;
                    return;
                }
            }

            this.user_charts.push(new_chart);
        });
    }

    del_user_chart(): void {
        const user_chart = this.selectedItems[0];

        this.schemeService.del_chart(user_chart).subscribe(is_removed => {
            if (!is_removed) {
                return;
            }

            for (const chart_i in this.user_charts) {
                if (this.user_charts[chart_i].id === user_chart.id) {
                    this.user_charts.splice(parseInt(chart_i), 1);
                    break;
                }
            }

            this.selectedItems = [];
            if (this.user_charts.length) {
                this.selectedItems.push(this.user_charts[0]);
            }
        });
    }

    buildChart() {
        this.paramsChange.emit({
            timeFrom: parseDate(this.date_from, this.time_from),
            timeTo: parseDate(this.date_to, this.time_to),
            selectedItems: this.selectedItems,
            user_chart: this.user_chart,
            user_charts: this.user_charts,
            charts_type: this.charts_type,
            paramSelected: this.paramSelected,
            data_part_size: this.data_part_size,
        });
    }
}