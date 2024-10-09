import React from 'react';

export default function useValueRef<T>(value: T) {
  const ref = React.useRef(value);
  ref.current = value;
  return ref;
}
