import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  first,
  merge,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

export type Nil = null | undefined;

export type ObservableState<T> = Observable<T> & {
  getValue: () => T;
};

export function toObservableState<T>(
  obs$: Observable<T>,
  getValue: () => T,
): ObservableState<T> {
  Object.defineProperty(obs$, 'getValue', getValue);
  return obs$ as ObservableState<T>;
}

export type QueryResult<T> = {
  data$: ObservableState<T | Nil>;
  isLoading$: ObservableState<boolean>;
  isError$: ObservableState<boolean>;
  getError: () => Error | Nil;
  refetch: () => void;
};

export function defineQuery<
  TData,
  TArgs extends [...ObservableState<any>[]],
>(config: {
  queryArgs: TArgs;
  queryFn: (...args: MapArgs<TArgs>) => Observable<TData>;
}): QueryResult<TData> {
  const state$ = new BehaviorSubject<TData | Nil>(void 0);
  const isLoading$ = new BehaviorSubject(true);
  const isError$ = new BehaviorSubject(false);
  let error: Error | Nil = void 0;

  const refetch$ = new BehaviorSubject<void>(void 0);

  function setLoading(): void {
    isLoading$.next(true);
    isError$.next(false);
    state$.next(void 0);
    error = void 0;
  }

  function handleSuccess(data: TData): void {
    isLoading$.next(false);
    isError$.next(false);
    error = void 0;
    state$.next(data);
  }

  function handleError(e: any): Observable<never> {
    isLoading$.next(false);
    isError$.next(true);
    error = e;
    return EMPTY;
  }

  const data$ = merge(
    state$,
    merge(refetch$, ...config.queryArgs).pipe(
      debounceTime(0),
      switchMap(() => {
        setLoading();
        return config
          .queryFn(...(config.queryArgs.map((arg) => arg.getValue()) as any))
          .pipe(first(), tap(handleSuccess), catchError(handleError));
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
  } satisfies QueryResult<TData>;
}

type MapArgs<Tuple extends [...ObservableState<any>[]]> = {
  [Index in keyof Tuple]: Observed<Tuple[Index]>;
};

type Observed<T extends ObservableState<any>> =
  T extends ObservableState<infer K> ? K : T;
