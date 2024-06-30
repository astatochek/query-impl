import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RxjsExampleComponent } from './rxjs/example.component';
import { SignalExampleComponent } from './signal/example.component';
import { UserComponent } from './signal/user.component';
import { UppercaseComponentComponent } from './signal/uppercase.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RxjsExampleComponent,
    SignalExampleComponent,
    UserComponent,
    UppercaseComponentComponent,
  ],
  template: `<app-uppercase />`,
})
export class AppComponent {}
