import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";

import { Section, DeviceItem, ParamValue } from "../../house/house";
import { HouseService } from "../../house/house.service";
import { ControlService } from "../../house/control.service"

@Component({
  selector: 'app-operation-hours',
  templateUrl: './operation-hours.component.html',
  styleUrls: ['../../sections.css', './operation-hours.component.css']
})
export class OperationHoursComponent implements OnInit 
{
  is_changed_ = false;

  day_start_: ParamValue;
  day_end_: ParamValue;
  time_start_ = '00:00' as string;
  time_stop_ = '00:00' as string;
  is_around_the_clock_ = false;
 
  constructor(
    private route: ActivatedRoute,
    private houseService: HouseService,
    private controlService: ControlService) { }

  ngOnInit() 
  {
    this.get_info();
  }

  get_info(): void
  {
    for (let sct of this.houseService.house.sections) 
	  {
      if (sct.id == 1)
      {
        for (let group of sct.groups)
        {
          if (group.type.name == 'proc')
          {                        
            for (let parent of group.params)
            {
              if (parent.param.name == 'day_night')
              {
                for (let param of parent.childs)
                {
                  if (param.param.name == 'day_start')
                  {
                    this.day_start_ = param;
                  }
                  else if (param.param.name == 'day_end')
                  {
                    this.day_end_ = param;
                  }
                }
              }
            }            
          }
        }        
      }      
    }

    if (this.day_start_ !== undefined && this.day_end_ !== undefined)
    {
      this.time_start_ = this.parse_secs_to_hhmm(parseInt(this.day_start_.value));
      this.time_stop_ = this.parse_secs_to_hhmm(parseInt(this.day_end_.value));
    }

    if (this.time_start_ == this.time_stop_)
    {
      this.is_around_the_clock_ = true;
    }
  }

  parse_secs_to_hhmm(secs: number): string
  {
    let pad = (val: number) => {
      return ('0' + val.toFixed(0)).slice(-2);
    };
    let h = pad(secs / 3600);
    secs %= 3600;
    let m = pad(secs / 60);
    return h + ':' + m;
  }

  parse_hhmm_to_secs(hhmm: string): number
  {
    let arr = hhmm.split(':').reverse();
    let new_value = 0;
    if (arr.length > 1)
    {
      new_value += parseInt(arr[0]) * 60;
      new_value += parseInt(arr[1]) * 3600;
    }
    return new_value;
  }

  set_value(e)
  {
    this.is_around_the_clock_ = e.checked;
  }

  click_apply_button(): void
  {
    let time_start_sec = this.parse_hhmm_to_secs(this.time_start_);
    let time_stop_sec = this.parse_hhmm_to_secs(this.time_stop_);
    if (this.is_around_the_clock_)
    {
      time_start_sec = 0;
      time_stop_sec = 0;
    }
    else if (time_stop_sec == time_start_sec)
    {
      this.is_around_the_clock_ = true;
    }
    this.day_start_.value = time_start_sec.toString();
    this.day_end_.value = time_stop_sec.toString();
    
    let params: ParamValue[] = [];
    params.push(this.day_start_);
    params.push(this.day_end_)
    this.controlService.changeParamValues(params); 
    this.is_changed_ = true;
  }
}