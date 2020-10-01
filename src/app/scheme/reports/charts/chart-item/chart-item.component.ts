import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Chart} from '../../../scheme';
import {BaseChartDirective} from 'ng2-charts';
import {SchemeService} from '../../../scheme.service';
import {Scheme_Group_Member} from '../../../../user';
import {ColorPickerDialog} from '../color-picker-dialog/color-picker-dialog';
import {Chart_Info_Interface} from '../chart-types';
import {MatDialog} from '@angular/material/dialog';

@Component({
    selector: 'app-chart-item',
    templateUrl: './chart-item.component.html',
    styleUrls: ['./chart-item.component.css']
})
export class ChartItemComponent implements OnInit, OnChanges {
    @Input() chart_: Chart_Info_Interface;
    @ViewChild('chart_obj') chart: BaseChartDirective;

    options = {
        elements: {
            point: {radius: 0},
            line: {tension: 0}
        },
        animation: {duration: 0},
        responsive: true,
        responsiveAnimationDuration: 0,
        legend: {
            // display: false,
            // position: 'bottom',
            onClick: (e, legendItem) => {
                const dataset = (<any>this.chart.data).datasets[legendItem.datasetIndex];
                dataset.hidden = !dataset.hidden;

                const y_axix = (<any>this.chart.chart).scales['y-axis-0'];
                this.adjust_stepped(dataset, y_axix.min, y_axix.max);

                this.chart.chart.update();
            }
        },
        //  maintainAspectRatio: false,
        tooltips: {
            mode: 'nearest',
            intersect: false,
            callbacks: {label: (item, data) => this.onLabel(item, data)}
        },
        hover: {
            mode: 'nearest',
            intersect: false,
            animationDuration: 0
        },
        scales: {
            xAxes: [{
                type: 'time',
                // unit: 'hour',
                // unitStepSize: 1,
                time: {
                    // format: 'MM/DD/YYYY HH:mm',
                    tooltipFormat: 'DD MMMM YYYY HH:mm:ss',
                    // round: 'hour',
                    displayFormats: {
                        millisecond: 'H:m',
                        second: 'H:m',
                        minute: 'H:m',
                        hour: 'H:m',
                        day: 'H:m',
                    },
                    // min: new Date({{ year }}, {{ month }} - 1, {{ day }}),
                    // max: new Date({{ year }}, {{ month }} - 1, {{ day }}, 23, 59, 59),
                },
                ticks: {
                    sampleSize: 10,
                    maxRotation: 45,
                    minRotation: 45
                    // min: new Date({{ year }}, {{ month }} - 1, {{ day }}),
                    // max: new Date({{ year }}, {{ month }} - 1, {{ day }}, 23, 59, 59),
                    // callback: function(value) {
                    // console.log(value);
                    // return value;
                    // },
                },
            }],
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    rangeMax: {x: new Date()}, // TODO: update this sometimes
                    onPanComplete: chart => this.onZoom(chart)
                },
                zoom: {
                    enabled: true,
                    mode: 'x',
                    onZoomComplete: chart => this.onZoom(chart)
                }
            }
        },
    };

    type = 'line';
    private members: Scheme_Group_Member[];

    constructor(
        private schemeService: SchemeService,
        private dialog: MatDialog,
    ) {
    }

    ngOnInit(): void {
        this.schemeService.getMembers().subscribe(members => this.members = members.results);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.chart_ && changes.chart_.currentValue) {
            const chart = changes.chart_.currentValue;
            const { min_y, max_y } = chart;
            if (chart.datasets) chart.datasets.forEach(dataset => this.adjust_stepped(dataset, min_y, max_y));
            setTimeout(() => this.onZoom(this.chart), 500);
        }
    }

    random_color(): void {
        for (const data of (<any>this.chart.data).datasets) {
            const rgb_str = `${this.randomColorFactor()},${this.randomColorFactor()},${this.randomColorFactor()}`;
            data.borderColor = `rgba(${rgb_str},0.4)`;
            data.backgroundColor = `rgba(${rgb_str},0.5)`;
            data.pointBorderColor = `rgba(${rgb_str},0.7)`;
            data.pointBackgroundColor = `rgba(${rgb_str},0.5)`;
        }
        this.chart.chart.update();
    }

    randomColorFactor(): number {
        return Math.round(Math.random() * 255);
    }

    onZoom(chart: any): void {
        const threshold = this.getDecimationTreshold(chart);
        const xAxisInfo = this.getXAxisInfo(chart);

        for (const dataset of chart.chart.data.datasets) {
            this.dataDecimation(dataset, threshold, xAxisInfo);
        }
        chart.chart.update();
    }

    getXAxisInfo(chart: any): any {
        const xAxis = chart.chart.scales['x-axis-0'];
        const delta = xAxis.max - xAxis.min;
        return {min: xAxis.min, max: xAxis.max, pixelTime: delta / xAxis.width};
    }

    getDecimationTreshold(chart: any): number {
        const yAxis = chart.chart.scales['y-axis-0'];
        const yDelta = yAxis.max - yAxis.min;
        return yDelta / 5;
    }

    dataDecimation(dataset: any, threshold: number, xAxisInfo: any): void {
        if (!dataset.realData.length) {
            return;
        }

        const data = [];

        let middled = false;
        let firstItem;
        let lastItem;
        let x;

        for (const item of dataset.realData) {
            x = item.x.getTime();
            if (x < xAxisInfo.min) {
                firstItem = item;
                continue;
            } else if (x > xAxisInfo.max) {
                if (lastItem) {
                    data.push({x: new Date(xAxisInfo.max), y: lastItem.y});
                }
                break;
            } else if (firstItem) {
                data.push({x: new Date(xAxisInfo.min), y: firstItem.y});
                firstItem = undefined;
            }

            if (lastItem
                && item.y > (lastItem.y - threshold)
                && item.y < (lastItem.y + threshold)
                && (x - lastItem.x.getTime()) < xAxisInfo.pixelTime) {
                if (!middled) {
                    middled = true;
                    data[data.length - 1] = lastItem = {...lastItem};
                }

                lastItem.x = new Date((lastItem.x.getTime() + x) / 2);
                lastItem.y = (lastItem.y + item.y) / 2;
            } else {
                middled = false;
                data.push(item);
                lastItem = item;
            }
        }

        dataset.data = data;
    }

    adjust_stepped(dataset: any, y_min: number, y_max: number): void {
        if (dataset.hidden || !dataset.steppedLine || !dataset.data.length || !dataset.dev_item) {
            return;
        }

        const pr = (y_max - y_min) * 0.1;
        const y0 = y_min + pr;
        const y1 = y_max - pr;

        dataset['my_cond'] = y1;

        let cond;
        let finded = false;
        for (const item of dataset.data) {
            if (item.y !== null) {
                if (cond === undefined) {
                    cond = item.y;
                } else if (item.y !== cond) {
                    finded = true;
                    if (item.y > cond) {
                        cond = item.y;
                    }
                    break;
                }
            }
        }

        if (!finded && cond == 0) {
            cond = 1;
        }

        for (const item of dataset.data) {
            item.y = item.y < cond ? y0 : y1;
        }
    }

    onLabel(item, data): string {
        // console.log('callback label:', item, data);
        const dataset = data.datasets[item.datasetIndex];
        let text = dataset.steppedLine && dataset.dev_item ?
            (item.yLabel < dataset['my_cond'] ? '0' : '1') :
            item.value;

        if (dataset.usered_data) {
            const x = dataset.data[item.index].x.getTime();
            const user_id = dataset.usered_data[x];
            if (dataset.usered_data[x]) {
                for (const user of this.members) {
                    if (user.id === user_id) {
                        text += ' User: ' + user.name;
                        break;
                    }
                }
            }
        }
        return dataset.label + ': ' + text;
    }

    openColorPicker(chart: Chart_Info_Interface, dataset: any, chart_obj: any): void {
        const dialogRef = this.dialog.open(ColorPickerDialog, {
            width: '250px',
            data: {chart, dataset, chart_obj}
        });

        dialogRef.afterClosed().subscribe(color => {
            if (!color) {
                return;
            }

            const rgb_str = `${color.red},${color.green},${color.blue}`;
            dataset.borderColor = `rgba(${rgb_str},0.4)`;
            dataset.backgroundColor = `rgba(${rgb_str},0.5)`;
            dataset.pointBorderColor = `rgba(${rgb_str},0.7)`;
            dataset.pointBackgroundColor = `rgba(${rgb_str},0.5)`;

            this.chart.chart.update();
        });
    }
}