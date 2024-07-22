import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Observable, delay, of, switchMap, throwError, timer } from 'rxjs';
import { async } from './async-query';
import { FormsModule } from '@angular/forms';

type User = {
  id: number;
  name: string;
  age: number;
};

@Component({
  selector: 'app-user',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <p><input [value]="userId()" type="number" (input)="onInput($event)" /></p>
    @if (getUser.isLoading()) {
      Loading...
    }
    @if (getUser.isError()) {
      {{ getUser.error() | json }}
    }
    @if (getUser.data(); as data) {
      {{ data | json }}
    }
  `,
})
export class UserComponent {
  http = new FakeHttp();

  userId = signal<number | undefined>(undefined);

  onInput(event: Event): void {
    const id = Number((event.target as HTMLInputElement).value);
    if (isNaN(id)) this.userId.set(undefined);
    this.userId.set(id);
  }

  getUser = async(
    () => {
      const userId = this.userId();
      if (!userId) return;
      return this.http.getUserById(userId);
    },
    { parseError: () => 'Something went wrong...' },
  );
}

class FakeHttp {
  private NUM_USERS = 1000;
  private USERS: User[] = Array.from(Array(this.NUM_USERS).keys()).map(
    (id) => ({
      id,
      name: `USER-${id}`,
      age: Math.floor(Math.random() * 100),
    }),
  );

  getUserById(id: number): Observable<User> {
    const user = this.USERS.find(({ id: userId }) => userId === id);
    const ms = Math.floor(Math.random() * 1000);
    if (!user)
      return timer(ms).pipe(
        switchMap(() =>
          throwError(
            () =>
              new HttpErrorResponse({
                error: 'unknow error',
                url: `/api/user/${id}`,
              }),
          ),
        ),
      );

    return of(user).pipe(delay(ms));
  }
}
