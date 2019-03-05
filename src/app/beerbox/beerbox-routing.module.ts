import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ReplaceKegComponent } from "./replace-keg/replace-keg.component";
import { WashComponent } from "./wash/wash.component";
import { CalibrationComponent } from "./calibration/calibration.component"
import { CheckHeadStandComponent } from "./check-head-stand/check-head-stand.component";

const beerboxRoutes: Routes = [
  { 
    path: '', 
    children: [
      { path: 'replace_keg', component: ReplaceKegComponent },
      { path: 'wash', component: WashComponent },
      { path: 'calibration', component: CalibrationComponent },
	  { path: 'check-head-stand', component: CheckHeadStandComponent },
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(beerboxRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class BeerboxRoutingModule { }
