export default function createStore<T>(initialData: T) {
  let state = initialData;
  let callbacks = new Set<() => void>();

  return {
    get(): T {
      return state;
    },
    set(value: T) {
      state = value;
      callbacks.forEach((cb) => cb());
    },
    subscribe(cb: () => void) {
      callbacks.add(cb);

      return () => {
        callbacks.delete(cb);
      };
    },
  };
}
