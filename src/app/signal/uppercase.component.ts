import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { delay, of } from 'rxjs';
import { async } from './async-query';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  selector: 'app-uppercase',
  template: `
    <input [(ngModel)]="text" />
    @if (getText.isLoading()) {
      Loading...
    }
    @if (getText.isError()) {
      {{ getText.error() | json }}
    }
    @if (getText.data()) {
      {{ getText.data() | json }}
    }
  `,
})
export class UppercaseComponentComponent {
  text = signal('');

  getText = async(() => this.toUpperCase(this.text()));

  toUpperCase(text: string) {
    return of(text.toUpperCase()).pipe(delay(1000));
  }
}
