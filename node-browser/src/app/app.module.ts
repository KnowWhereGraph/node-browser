import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import {BrowseComponent} from './browse/browse.component'
import {BrowserMap} from './browser-map/browser-map.component'
import { HeaderComponent } from './header/header.component';
import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import {MatTooltipModule} from '@angular/material/tooltip'; 
import {MatIconModule} from '@angular/material/icon'


@NgModule({
  declarations: [
    AppComponent,
    BrowseComponent,
    BrowserMap,
    HeaderComponent,
    NavComponent,
    FooterComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      { path: 'browse', component: BrowseComponent}
    ]),
    MatIconModule,
    MatTooltipModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
