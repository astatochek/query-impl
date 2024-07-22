import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { async } from './async-query';
import { Observable, of, switchMap, throwError, timer } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'signal-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p>
      <button (click)="a.set(a() + 1)">a: {{ a() }}</button>
    </p>
    <p>
      <button (click)="b.set(b() + 1)">b: {{ b() }}</button>
    </p>
    <p><button (click)="query.refetch()">Refetch</button></p>
    <p><button (click)="reset()">Reset</button></p>

    @if (query.isLoading()) {
      Loading...
    }
    @if (query.isError()) {
      Error: {{ query.error() | json }}
    }
    @if (query.data(); as data) {
      Data: {{ data | json }}
    }
  `,
})
export class SignalExampleComponent {
  readonly a = signal(1);
  readonly b = signal(1);

  readonly query = async(() => this.getData(this.a(), this.b()));

  getData(a: number, b: number): Observable<number> {
    return timer(1000).pipe(
      switchMap(() =>
        Math.random() > 0.5 ? of(a + b) : throwError(() => 'Error!'),
      ),
    );
  }

  reset(): void {
    this.a.set(1);
    this.b.set(1);
  }
}
