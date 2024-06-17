import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { defineQuery } from './query';
import { BehaviorSubject, of, switchMap, throwError, timer } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'rxjs-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p>
      <button (click)="a.next(a.getValue() + 1)">a: {{ a | async }}</button>
    </p>
    <p>
      <button (click)="b.next(b.getValue() + 1)">b: {{ b | async }}</button>
    </p>
    <p><button (click)="query.refetch()">Refetch</button></p>
    <p><button (click)="reset()">Reset</button></p>
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
export class RxjsExampleComponent {
  readonly a = new BehaviorSubject(1);
  readonly b = new BehaviorSubject(1);

  readonly query = defineQuery({
    queryArgs: [this.a, this.b],
    queryFn: (a, b) =>
      timer(1000).pipe(
        switchMap(() => {
          return Math.random() > 0.5 ? of(a + b) : throwError(() => 'Error!');
        }),
      ),
  });

  reset(): void {
    this.a.next(1);
    this.b.next(1);
  }
}
