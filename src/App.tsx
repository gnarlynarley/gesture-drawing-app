import React from 'react';
import {
  Pause,
  PlayArrow,
  SkipNext,
  FastForward,
  Folder,
  Replay,
  Dashboard,
  Image,
  Palette,
  SwapHoriz,
  SwapVert,
  Timer,
  Refresh,
} from '@material-ui/icons';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readFile } from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';
import cx from './lib/utils/cx';
import Button from './lib/components/Button';
import ProgressBar from './lib/components/ProgressBar';
import Modal from './lib/components/Modal';
import Input from './lib/components/Input';
import './App.scss';
import useKeyBind from './lib/hooks/useKeyBind';
import playDing from './lib/utils/playDing';
import useTimer from './lib/hooks/useTimer';

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  const [view, setView] = React.useState<'app' | 'intermission' | 'overview'>(
    'app'
  );
  const [loading, setLoading] = React.useState<false | 'directory' | 'file'>(
    false
  );
  const [showMaxTimeModal, setShowMaxTimeModal] = React.useState(false);
  const [intermissionSeconds, setIntermissionSeconds] = React.useState(0);
  const [maxTime, setMaxTime] = React.useState(120);
  const [files, setFiles] = React.useState<FileEntry[]>([]);
  const [history, setHistory] = React.useState<string[]>([]);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const autoplay = useSetting();
  const grayscale = useSetting();
  const flippedHorizontal = useSetting();
  const flippedVertical = useSetting();
  const timer = useTimer();
  const isOverTime = timer.time >= maxTime;
  const hasFilesLoaded = files.length > 0;
  const formattedTime = isOverTime
    ? formatTime(timer.time)
    : formatTime(maxTime - timer.time);

  const changeMaxTime = () => {
    setShowMaxTimeModal(true);
  };

  const nextRandomImage = async (skip = false, _files = files) => {
    try {
      timer.reset();
      timer.pause();

      if (!skip && imageSrc) {
        setHistory((prev) => prev.concat(imageSrc));
      }
      const [url] = await Promise.all([
        Promise.resolve().then(async () => {
          const randomIndex = Math.floor(Math.random() * _files.length);
          const randomPath = _files[randomIndex];
          if (!randomPath) return null;
          const pathname = await path.join(
            randomPath.pathname,
            randomPath.name
          );
          const buffer = await readFile(pathname);
          const blob = new Blob([buffer]);
          const url = URL.createObjectURL(blob);

          return url;
        }),
        Promise.resolve().then(async () => {
          if (autoplay.value && !skip) {
            setView('intermission');
            setIntermissionSeconds(3);
            await sleep(1000);
            setIntermissionSeconds(2);
            await sleep(1000);
            setIntermissionSeconds(1);
            await sleep(1000);
          }
        }),
      ]);
      setView('app');
      setLoading('file');
      setImageSrc(url);
      timer.play();
    } finally {
      setLoading(false);
    }
  };

  const changeView = (view: 'app' | 'overview') => {
    switch (view) {
      case 'app':
        setView('app');
        break;
      case 'overview':
        setView('overview');
        timer.pause();
        break;
    }
  };

  const openFolder = async () => {
    try {
      setLoading('directory');
      const selected = await open({ directory: true });
      if (!selected) return;
      const files = await recursiveFileRead(selected);
      setFiles(files);
      nextRandomImage(false, files);
    } finally {
      setLoading(false);
    }
  };

  const wrapperClassName = cx(
    'wrapper',
    grayscale.value && 'is-grayscale',
    flippedHorizontal.value && 'is-flipped-horizontal',
    flippedVertical.value && 'is-flipped-vertical',
    isOverTime && 'is-over-time'
  );

  useKeyBind('spacebar', () => timer.toggle());

  React.useEffect(() => {
    if (autoplay.value && isOverTime) {
      nextRandomImage();
    }
  }, [autoplay.value, isOverTime]);

  React.useEffect(() => {
    if (isOverTime) {
      playDing();
    }
  }, [isOverTime]);

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
          <Button
            onClick={openFolder}
            loading={loading === 'directory'}
            icon={<Folder />}
          >
            {hasFilesLoaded ? 'Change directory' : 'Set directory'}
          </Button>
          {hasFilesLoaded && (
            <>
              <Button
                onClick={() => nextRandomImage()}
                loading={loading === 'file'}
                icon={<SkipNext />}
              >
                Next
              </Button>
              <Button
                onClick={() => nextRandomImage(true)}
                loading={loading === 'file'}
                icon={<FastForward />}
              >
                Skip
              </Button>
              <Button
                onClick={() => autoplay.toggle()}
                primary={autoplay.value}
                icon={<Replay />}
              >
                Autoplay
              </Button>
              <Button
                onClick={() =>
                  changeView(view === 'overview' ? 'app' : 'overview')
                }
                icon={view === 'app' ? <Dashboard /> : <Image />}
              >
                Show {view === 'overview' ? 'Back to app' : 'Overview'}
              </Button>

              <span className="divider" />

              {view === 'app' && (
                <>
                  <Button
                    onClick={grayscale.toggle}
                    primary={grayscale.value}
                    icon={<Palette />}
                  >
                    Grayscale
                  </Button>
                  <Button
                    onClick={flippedHorizontal.toggle}
                    primary={flippedHorizontal.value}
                    icon={<SwapHoriz />}
                  >
                    Flip horizontal
                  </Button>
                  <Button
                    onClick={flippedVertical.toggle}
                    primary={flippedVertical.value}
                    icon={<SwapVert />}
                  >
                    Flip vertical
                  </Button>
                  <span className="spacer" />
                  <Button
                    type="button"
                    onClick={changeMaxTime}
                    icon={<Timer />}
                  >
                    {formattedTime} / {formatTime(maxTime)}
                  </Button>
                  <Button
                    onClick={timer.toggle}
                    primary={timer.playing}
                    icon={timer.playing ? <Pause /> : <PlayArrow />}
                  >
                    {timer.playing ? 'Pause' : 'Play'}
                  </Button>
                  <Button onClick={timer.reset} icon={<Refresh />}>
                    Reset
                  </Button>
                </>
              )}
              {view === 'overview' && (
                <Button onClick={() => setHistory([])}>Clear history</Button>
              )}
            </>
          )}
        </div>

        <div className="content">
          {view === 'app' && imageSrc && (
            <div className="image">
              <img src={imageSrc} alt="selected" />
            </div>
          )}
          {view === 'intermission' && (
            <h1>Next coming in {intermissionSeconds}</h1>
          )}
          {view === 'overview' && (
            <div className="overview">
              {history.map((url, i) => (
                <img src={url} key={i} alt={`history-${i}`} />
              ))}
            </div>
          )}
        </div>

        <div className="progress-bar">
          <ProgressBar active={timer.playing} progress={timer.time / maxTime} />
        </div>
      </div>
    </>
  );
}
