import { useSyncExternalStore } from 'react';
import { store, setSetting } from '../utils/settingsStore';

export default function useSettings() {
  const settings = useSyncExternalStore(store.subscribe, store.get);

  return {
    settings,
    setSetting,
  };
}
