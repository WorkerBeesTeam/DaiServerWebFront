import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsService } from './settings.service';

import { SettingsComponent } from './settings.component';
import { DevicesComponent } from './devices/devices.component';
import { SectionsComponent } from './sections/sections.component';
import { GroupTypesComponent } from './group-types/group-types.component';
import { StatusTypesComponent } from './status-types/status-types.component';
import { SignTypesComponent } from './sign-types/sign-types.component';
import { CodeComponent, CodesComponent } from './code/code.component';

import { MonacoEditorModule, NgxMonacoEditorConfig, NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor';
const monacoConfig: NgxMonacoEditorConfig = {
  baseUrl: 'static', // configure base path for monaco editor
  defaultOptions: { scrollBeyondLastLine: false }, // pass deafult options to be used
//  onMonacoLoad: () => { console.log((<any>window).monaco); } // here monaco object will be avilable as window.monaco use this function to extend monaco editor functionalities.
};

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsRoutingModule,
    MonacoEditorModule, // use forRoot() in main app module only.
  ],
  declarations: [
    SettingsComponent, 
    DevicesComponent, 
    SectionsComponent, 
    GroupTypesComponent, 
    StatusTypesComponent, 
    SignTypesComponent, 
    CodesComponent,
    CodeComponent,
  ],
  entryComponents: [
  ],
  providers: [
//    ProjectLoadGuard,
//    ControlService,
    SettingsService,
    { provide: NGX_MONACO_EDITOR_CONFIG, useValue: monacoConfig }
  ]
})
export class SettingsModule { }
