import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RxjsExampleComponent } from './rxjs/example.component';
import { SignalExampleComponent } from './signal/example.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RxjsExampleComponent, SignalExampleComponent],
  template: ` <signal-example />`,
})
export class AppComponent {}
