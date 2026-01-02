export interface TypedPromiseConstructor<ResolveType, RejectType> extends PromiseConstructor {
  /**
   * Creates a new Promise.
   * @param executor A callback used to initialize the promise. This callback is passed two arguments:
   * a resolve callback used to resolve the promise with a value or the result of another promise,
   * and a reject callback used to reject the promise with a provided reason or error.
   */
  new <T = ResolveType, R = RejectType>(
    executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: R) => void) => void
  ): TypedPromise<T, R>;
}

export interface TypedPromise<ResolveType, RejectType> extends Promise<ResolveType> {
  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(
    onrejected?: ((reason: RejectType) => TResult | PromiseLike<TResult>) | undefined | null
  ): TypedPromise<ResolveType, TResult>;

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = ResolveType, TResult2 = never>(
    onfulfilled?: ((value: ResolveType) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: RejectType) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2>;
}
