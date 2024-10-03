import { path } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/plugin-fs';

export interface FileEntry {
  pathname: string;
  name: string;
}

export default async function recursiveFileRead(
  pathname: string,
  files: string[] = []
): Promise<FileEntry[]> {
  try {
    const entries = await readDir(pathname);
    const promises = await Promise.all(
      entries.flatMap(async (entry): Promise<FileEntry | FileEntry[]> => {
        if (entry.isDirectory) {
          return recursiveFileRead(
            await path.join(pathname, entry.name),
            files
          );
        }

        if (/\.(jpg|jpeg|png|gif)$/.test(entry.name)) {
          return {
            pathname,
            name: entry.name,
          };
        }

        return [];
      })
    );

    return promises.flat(1);
  } catch (err) {
    console.log(err);
    return [];
  }
}
