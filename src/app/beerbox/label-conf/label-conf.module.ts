import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TapListComponent } from './tap-list/tap-list.component';
import { LabelComponent } from './label/label.component';
import { LabelElementTextComponent } from './label/label-element-text/label-element-text.component';
import {DragDropModule} from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [TapListComponent, LabelComponent, LabelElementTextComponent],
  imports: [
    CommonModule,
    DragDropModule
  ],
  entryComponents: [LabelElementTextComponent]
})
export class LabelConfModule { }