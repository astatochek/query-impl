import {
  Injector,
  Signal,
  assertInInjectionContext,
  inject,
  signal,
  effect,
  runInInjectionContext,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, first } from 'rxjs';

export type QueryResult<T> = {
  data: Signal<T | undefined>;
  isLoading: Signal<boolean>;
  isError: Signal<boolean>;
  getError: () => Error | undefined;
  refetch: () => void;
};

export function async<T>(
  queryFn: () => Observable<T> | undefined,
  injector?: Injector,
): QueryResult<T> {
  if (!injector) {
    assertInInjectionContext(async);
  }
  const _injector = injector ?? inject(Injector);

  const data = signal<T | undefined>(void 0);
  const isLoading = signal(true);
  const isError = signal(false);

  let error: Error | undefined = void 0;

  const refetchTrigger = signal(0);

  function handleSuccess(value: T): void {
    isError.set(false);
    isLoading.set(false);
    error = void 0;
    data.set(value);
  }

  function handleError(e: any): void {
    isError.set(true);
    isLoading.set(false);
    error = e;
    data.set(void 0);
  }

  function setLoading(): void {
    isError.set(false);
    isLoading.set(true);
    error = void 0;
    data.set(void 0);
  }

  runInInjectionContext(_injector, () => {
    const dr = inject(DestroyRef);
    effect(
      (onCleanup) => {
        refetchTrigger();

        const query = queryFn();
        if (!query) return;

        setLoading();

        const subscription = query
          .pipe(takeUntilDestroyed(dr), first())
          .subscribe({
            next: handleSuccess,
            error: handleError,
          });

        onCleanup(() => subscription.unsubscribe());
      },
      { allowSignalWrites: true },
    );
  });

  return {
    data: data.asReadonly(),
    isLoading: isLoading.asReadonly(),
    isError: isError.asReadonly(),
    getError: () => error,
    refetch: () => refetchTrigger.set(refetchTrigger() + 1),
  } satisfies QueryResult<T>;
}
