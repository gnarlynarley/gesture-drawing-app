import React from 'react';

const KEY_TO_KEYVALUE_MAP: Record<string, string> = {
  ' ': 'spacebar',
};

export default function useKeyBind(key: string, cb: () => void) {
  const cbRef = React.useRef(cb);

  React.useEffect(() => {
    cbRef.current = cb;
  });

  React.useEffect(() => {
    const abortController = new AbortController();

    document.addEventListener(
      'keydown',
      (ev) => {
        const normalizedKey =
          KEY_TO_KEYVALUE_MAP[ev.key] || ev.key.toLowerCase();
        if (normalizedKey === key) {
          ev.preventDefault();
          cbRef.current();
        }
      },
      {
        signal: abortController.signal,
      }
    );

    return () => {
      abortController.abort();
    };
  });
}
