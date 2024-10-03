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
  VolumeUp,
  VolumeMute,
} from '@material-ui/icons';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';
import cx from './lib/utils/cx';
import Button from './lib/components/Button';
import ProgressBar from './lib/components/ProgressBar';
import useKeyBind from './lib/hooks/useKeyBind';
import playDing from './lib/utils/playDing';
import useTimer from './lib/hooks/useTimer';
import useSettings from './lib/hooks/useSettings';
import ChangeMaxTimeModal from './lib/components/ChangeTimeModal';
import './App.scss';
import sleep from './lib/utils/sleep';
import formatTime from './lib/utils/formatTime';
import recursiveFileRead, { FileEntry } from './lib/utils/recursiveFileRead';

function useSetting() {
  const [value, setValue] = React.useState(false);
  const toggle = () => setValue(!value);

  return { value, toggle };
}

export default function App() {
  const {
    settings: { time, lastOpenedDirectory, muted },
    setSetting,
  } = useSettings();
  const [view, setView] = React.useState<'app' | 'intermission' | 'overview'>(
    'app'
  );
  const [loading, setLoading] = React.useState<false | 'directory' | 'file'>(
    false
  );
  const [showTimeModal, setShowTimeModal] = React.useState(false);
  const [intermissionSeconds, setIntermissionSeconds] = React.useState(0);
  const [files, setFiles] = React.useState<FileEntry[]>([]);
  const [history, setHistory] = React.useState<string[]>([]);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const autoplay = useSetting();
  const grayscale = useSetting();
  const flippedHorizontal = useSetting();
  const flippedVertical = useSetting();
  const timer = useTimer();
  const isOverTime = timer.time >= time;
  const hasFilesLoaded = files.length > 0;
  const formattedTime = isOverTime
    ? formatTime(timer.time)
    : formatTime(time - timer.time);

  const changeMaxTime = () => {
    setShowTimeModal(true);
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
      setSetting('lastOpenedDirectory', selected);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let active = true;
    console.log('lastOpenedDirectory::', lastOpenedDirectory);
    if (lastOpenedDirectory) {
      setLoading('directory');
      console.log('loading', lastOpenedDirectory);
      recursiveFileRead(lastOpenedDirectory).then((files) => {
        if (!active) return;
        setFiles(files);
        nextRandomImage(false, files);
        setLoading(false);
      });
    } else {
      setLoading(false);
      setFiles([]);
    }

    return () => {
      active = false;
    };
  }, [lastOpenedDirectory]);

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
    if (isOverTime && muted === false) {
      playDing();
    }
  }, [isOverTime, muted]);

  return (
    <>
      {showTimeModal && (
        <ChangeMaxTimeModal
          initialMaxTime={time}
          onSubmit={(value) => {
            setShowTimeModal(false);
            setSetting('time', value);
          }}
          onCancel={() => {
            setShowTimeModal(false);
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
                {view === 'overview' ? 'Back to app' : 'Overview'}
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
                  <span className="divider" />

                  <Button
                    type="button"
                    onClick={changeMaxTime}
                    icon={<Timer />}
                  >
                    {formattedTime} / {formatTime(time)}
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
                  <Button
                    primary={!muted}
                    onClick={() => setSetting('muted', !muted)}
                    icon={!muted ? <VolumeMute /> : <VolumeUp />}
                  />
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
          <ProgressBar active={timer.playing} progress={timer.time / time} />
        </div>
      </div>
    </>
  );
}
