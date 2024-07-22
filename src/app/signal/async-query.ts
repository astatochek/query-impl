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

export type QueryResult<T, E> = {
  data: Signal<T | undefined>;
  isLoading: Signal<boolean>;
  isError: Signal<boolean>;
  error: Signal<E | undefined>;
  refetch: () => void;
};

export type QueryOptions<E = any> = Partial<{
  injector: Injector;
  parseError: (err: any) => E;
}>;

export function async<T, E = any>(
  queryFn: () => Observable<T> | undefined,
  options: QueryOptions<E> = {},
): QueryResult<T, E> {
  if (!options.injector) {
    assertInInjectionContext(async);
  }
  const injector = options.injector ?? inject(Injector);
  const parseError = options.parseError ?? ((e: any) => e);

  const data = signal<T | undefined>(void 0);
  const isLoading = signal(true);
  const isError = signal(false);
  const error = signal<E | undefined>(void 0);

  const refetchTrigger = signal(0);

  function refetch(): void {
    refetchTrigger.set(refetchTrigger() + 1);
  }

  function handleSuccess(value: T): void {
    isError.set(false);
    isLoading.set(false);
    error.set(void 0);
    data.set(value);
  }

  function handleError(e: any): void {
    isError.set(true);
    isLoading.set(false);
    error.set(parseError(e));
    data.set(void 0);
  }

  function setLoading(): void {
    isError.set(false);
    isLoading.set(true);
    error.set(void 0);
    data.set(void 0);
  }

  runInInjectionContext(injector, () => {
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
    error: error.asReadonly(),
    refetch,
  } satisfies QueryResult<T, E>;
}
