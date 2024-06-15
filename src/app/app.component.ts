import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { defineQuery } from './query';
import { of, switchMap, throwError, timer } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button (click)="query.refetch()">REFETCH</button>
    @if (query.isLoading$ | async) {
      Loading...
    }
    @if (query.isError$ | async) {
      Error: {{ query.getError() | json }}
    }
    @if (query.data$ | async; as data) {
      Data: {{ data | json }}
    }
  `,
})
export class AppComponent {
  readonly query = defineQuery({
    queryFn: () =>
      timer(1000).pipe(
        switchMap(() => {
          return Math.random() > 0.5
            ? of(Math.random())
            : throwError(() => 'Error!');
        }),
      ),
  });
}
