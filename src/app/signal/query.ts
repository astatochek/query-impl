import {
  Injector,
  Signal,
  assertInInjectionContext,
  inject,
  signal,
  effect,
} from '@angular/core';
import { Observable, first } from 'rxjs';

export type Nil = null | undefined;

export type QueryResult<T> = {
  data: Signal<T | Nil>;
  isLoading: Signal<boolean>;
  isError: Signal<boolean>;
  getError: () => Error | Nil;
  refetch: () => void;
};

export function defineQuery<T, const Args extends Signal<any>[] = []>(config: {
  queryArgs?: Args;
  queryFn: (...args: MapArgs<Args>) => Observable<T>;
  injector?: Injector;
}): QueryResult<T> {
  if (!config.injector) {
    assertInInjectionContext(defineQuery);
  }
  const injector = config.injector ?? inject(Injector);

  const data = signal<T | Nil>(void 0);
  const isLoading = signal(true);
  const isError = signal(false);

  let error: Error | Nil = void 0;

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

  effect(
    (onCleanup) => {
      const _trigger = refetchTrigger();

      const args = (config.queryArgs ?? []).map((dep) =>
        dep(),
      ) as MapArgs<Args>;
      setLoading();

      const subscription = config
        .queryFn(...args)
        .pipe(first())
        .subscribe({
          next: handleSuccess,
          error: handleError,
        });

      onCleanup(() => subscription.unsubscribe());
    },
    { injector, allowSignalWrites: true },
  );

  return {
    data: data.asReadonly(),
    isLoading: isLoading.asReadonly(),
    isError: isError.asReadonly(),
    getError: () => error,
    refetch: () => refetchTrigger.set(refetchTrigger() + 1),
  } satisfies QueryResult<T>;
}

type MapArgs<Args extends Signal<any>[]> = {
  [K in keyof Args]: Args[K] extends Signal<infer T> ? T : never;
};
