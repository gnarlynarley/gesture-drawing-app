import { appConfigDir, join, dirname } from '@tauri-apps/api/path';
import {
  exists,
  readTextFile,
  writeTextFile,
  mkdir,
} from '@tauri-apps/plugin-fs';
import createStore from './createStore';

export type Settings = {
  loaded: boolean;
  lastOpenedDirectory: string | null;
  time: number;
  muted: boolean;
  skipVersion: string | null;
};

function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const DEFAULT_SETTINGS: Settings = {
  loaded: false,
  lastOpenedDirectory: null,
  time: 120,
  muted: false,
  skipVersion: null,
};

const createPath = async () => join(await appConfigDir(), 'settings.json');

async function saveSettings(settings: Settings) {
  const settingsFilePath = await createPath();
  await mkdir(await dirname(settingsFilePath), { recursive: true });
  await writeTextFile(settingsFilePath, JSON.stringify(settings));
}

export const store = createStore(DEFAULT_SETTINGS);

async function bootstrapSettings() {
  const settingsFilePath = await createPath();
  const localInitialData =
    (await exists(settingsFilePath)) &&
    (tryParseJson(await readTextFile(settingsFilePath)) as Settings);
  const initialData: Settings = {
    ...DEFAULT_SETTINGS,
    ...localInitialData,
    loaded: true,
  };
  store.set(initialData);
}
bootstrapSettings();

store.subscribe(() => {
  saveSettings(store.get());
});

export function setSetting<T extends keyof Settings>(
  key: T,
  value: Settings[T]
) {
  store.set({ ...store.get(), [key]: value });
}
