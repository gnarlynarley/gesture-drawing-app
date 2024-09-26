import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readFile } from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';
import React from 'react';
import cx from './lib/utils/cx';
import './App.scss';
import Button from './lib/components/Button';
import ProgressBar from './lib/components/ProgressBar';
import Modal from './lib/components/Modal';
import Input from './lib/components/Input';

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

function useSetting() {
  const [value, setValue] = React.useState(false);
  const toggle = () => setValue(!value);

  return { value, toggle };
}

function useTimer() {
  const [time, setTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const play = () => setPlaying(true);
  const pause = () => setPlaying(false);
  const toggle = () => setPlaying(!playing);
  const reset = () => {
    setTime(0);
  };

  React.useEffect(() => {
    let interval: number | null = null;

    if (playing) {
      interval = setInterval(() => {
        setTime((time) => time + 1);
      }, 1000);
    }

    return () => {
      interval !== null && clearInterval(interval);
    };
  }, [playing]);

  return { time, playing, toggle, reset, play, pause };
}

function formatTime(time: number) {
  const seconds = time % 60;
  const minutes = Math.floor(time / 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function ChangeMaxTimeModal({
  initialMaxTime,
  onSubmit,
  onCancel,
}: {
  initialMaxTime: number;
  onSubmit(value: number): void;
  onCancel(): void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Modal
      title="Change time duration"
      onSubmit={() => onSubmit(inputRef.current!.valueAsNumber)}
      onCancel={onCancel}
    >
      <Input
        type="number"
        ref={inputRef}
        label="Time duration (in seconds)"
        defaultValue={initialMaxTime}
      />
    </Modal>
  );
}

export default function App() {
  const [loading, setLoading] = React.useState<false | 'directory' | 'file'>(
    false
  );
  const [showMaxTimeModal, setShowMaxTimeModal] = React.useState(false);
  const [maxTime, setMaxTime] = React.useState(120);
  const [files, setFiles] = React.useState<FileEntry[]>([]);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const grayscale = useSetting();
  const flippedHorizontal = useSetting();
  const flippedVertical = useSetting();
  const timer = useTimer();

  const changeMaxTime = () => {
    setShowMaxTimeModal(true);
  };

  const getRandomImage = async (_files = files) => {
    try {
      setLoading('file');
      const randomIndex = Math.floor(Math.random() * _files.length);
      const randomPath = _files[randomIndex];
      const pathname = await path.join(randomPath.pathname, randomPath.name);
      const buffer = await readFile(pathname);
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      setImageSrc(url);
      timer.reset();
    } finally {
      setLoading(false);
    }
  };

  const openFolder = async () => {
    try {
      setLoading('directory');
      const selected = await open({ directory: true });
      if (!selected) return;
      const files = await recursiveFileRead(selected);
      setFiles(files);
      getRandomImage(files);
    } finally {
      setLoading(false);
    }
  };

  const isOverTime = timer.time > maxTime;
  const hasFilesLoaded = files.length > 0;
  const formattedTime = isOverTime
    ? formatTime(timer.time)
    : formatTime(maxTime - timer.time);

  const wrapperClassName = cx(
    'wrapper',
    grayscale.value && 'is-grayscale',
    flippedHorizontal.value && 'is-flipped-horizontal',
    flippedVertical.value && 'is-flipped-vertical',
    isOverTime && 'is-over-time'
  );

  return (
    <>
      {showMaxTimeModal && (
        <ChangeMaxTimeModal
          initialMaxTime={maxTime}
          onSubmit={(value) => {
            setShowMaxTimeModal(false);
            setMaxTime(value);
          }}
          onCancel={() => {
            setShowMaxTimeModal(false);
          }}
        />
      )}
      <div className={wrapperClassName}>
        <div className="toolbar">
          <Button onClick={openFolder} loading={loading === 'directory'}>
            {hasFilesLoaded ? 'Change directory' : 'Set directory'}
          </Button>
          {hasFilesLoaded && (
            <>
              <Button
                onClick={() => getRandomImage()}
                loading={loading === 'file'}
              >
                get random
              </Button>
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
              <span className="divider" />
              <div className="time">
                <span>{formattedTime}</span>
                <span>/</span>
                <button type="button" onClick={changeMaxTime}>
                  {formatTime(maxTime)}
                </button>
              </div>
              <Button onClick={timer.toggle} primary={timer.playing}>
                Play/Pause
              </Button>
              <Button onClick={timer.reset}>Reset</Button>
            </>
          )}
        </div>

        {imageSrc && (
          <div className="image">
            <img src={imageSrc} alt="selected" />
          </div>
        )}

        <div className="progress-bar">
          <ProgressBar active={timer.playing} progress={timer.time / maxTime} />
        </div>
      </div>
    </>
  );
}
