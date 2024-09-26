import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readFile } from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';
import React from 'react';
import cx from './lib/utils/cx';
import './App.scss';
import Button from './lib/components/Button';

interface FileEntry {
  pathname: string;
  name: string;
}

async function recursiveFileRead(
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

        if (/\.(jpg|png)$/.test(entry.name)) {
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

function useSetting() {
  const [value, setValue] = React.useState(false);
  const toggle = () => setValue(!value);

  return { value, toggle };
}

export default function App() {
  const [files, setFiles] = React.useState<FileEntry[]>([]);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const grayscale = useSetting();
  const flippedHorizontal = useSetting();
  const flippedVertical = useSetting();

  const getRandomImage = async (_files = files) => {
    const randomIndex = Math.floor(Math.random() * _files.length);
    const randomPath = _files[randomIndex];
    const pathname = await path.join(randomPath.pathname, randomPath.name);
    const buffer = await readFile(pathname);
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    setImageSrc(url);
  };

  const openFolder = async () => {
    const selected = await open({ directory: true });
    if (!selected) return;
    const files = await recursiveFileRead(selected);
    setFiles(files);
    getRandomImage(files);
  };

  const wrapperClassName = cx(
    'wrapper',
    grayscale.value && 'is-grayscale',
    flippedHorizontal.value && 'is-flipped-horizontal',
    flippedVertical.value && 'is-flipped-vertical'
  );

  const hasFilesLoaded = files.length > 0;

  return (
    <div className={wrapperClassName}>
      <div className="toolbar">
        <Button onClick={openFolder}>
          {hasFilesLoaded ? 'Set directory' : 'Change directory'}
        </Button>
        {hasFilesLoaded && (
          <>
            <Button onClick={() => getRandomImage()}>get random</Button>
            <Button onClick={grayscale.toggle} primary={grayscale.value}>
              grayscale
            </Button>
            <Button
              onClick={flippedHorizontal.toggle}
              primary={flippedHorizontal.value}
            >
              flip horizontal
            </Button>
            <Button
              onClick={flippedVertical.toggle}
              primary={flippedVertical.value}
            >
              flip vertical
            </Button>
          </>
        )}
      </div>

      {imageSrc && (
        <div className="image">
          <img src={imageSrc} alt="selected" />
        </div>
      )}
    </div>
  );
}
