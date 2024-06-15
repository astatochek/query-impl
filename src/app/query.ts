import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  distinctUntilChanged,
  first,
  merge,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

export type Nil = null | undefined;

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Record<string, unknown>
    ? DeepReadonly<T[P]>
    : T[P];
};

export type ObservableState<T> = Observable<DeepReadonly<T>> & {
  getValue: () => DeepReadonly<T>;
};

function toObservableState<T>(
  obs$: Observable<T>,
  getValue: () => T,
): ObservableState<T> {
  Object.defineProperty(obs$, 'getValue', getValue);
  return obs$ as ObservableState<T>;
}

export type QueryResult<T> = {
  data$: ObservableState<DeepReadonly<T | Nil>>;
  isLoading$: ObservableState<boolean>;
  isError$: ObservableState<boolean>;
  getError: () => Error | Nil;
  refetch: () => void;
};

export function defineQuery<T>(config: {
  queryFn: () => Observable<T>;
}): QueryResult<T> {
  const state$ = new BehaviorSubject<DeepReadonly<T | Nil>>(void 0);
  const isLoading$ = new BehaviorSubject(true);
  const isError$ = new BehaviorSubject(false);
  let error: Error | Nil = void 0;

  const refetch$ = new BehaviorSubject<void>(void 0);

  const data$ = merge(
    state$,
    refetch$.pipe(
      switchMap(() => {
        isLoading$.next(true);
        isError$.next(false);
        state$.next(void 0);
        error = void 0;

        return config.queryFn().pipe(
          first(),
          tap((data) => {
            isLoading$.next(false);
            isError$.next(false);
            error = void 0;
            state$.next(data);
          }),
          catchError((e) => {
            isLoading$.next(false);
            isError$.next(true);
            error = e;
            return EMPTY;
          }),
        );
      }),
      switchMap(() => EMPTY),
    ),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  return {
    data$: toObservableState(data$, () => state$.getValue()),
    isError$: toObservableState(isError$.pipe(distinctUntilChanged()), () =>
      isError$.getValue(),
    ),
    isLoading$: toObservableState(isLoading$.pipe(distinctUntilChanged()), () =>
      isLoading$.getValue(),
    ),
    getError: () => error,
    refetch: () => refetch$.next(),
  } satisfies QueryResult<T>;
}
