import { invoke } from '@tauri-apps/api/core';

export default function openFileInExplorer(path: string): void {
  invoke('open_file_in_explorer', { path });
}
