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
import sleep from './lib/utils/sleep';
import formatTime from './lib/utils/formatTime';
import recursiveFileRead, { FileEntry } from './lib/utils/recursiveFileRead';
import VersionModal from './lib/components/VersionModal';
import OverViewPage from './lib/components/OverviewPage';
import { ImageItem } from './lib/models';
import createId from './lib/utils/createId';
import PageLayout from './lib/components/PageLayout';
import $ from './App.module.scss';

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
  const [history, setHistory] = React.useState<ImageItem[]>([]);
  const [imageSrc, setImageSrc] = React.useState<ImageItem | null>(null);
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
  const historyTime = React.useMemo(
    () => history.reduce((acc, item) => acc + (item.time ?? 0), 0),
    [history]
  );
  const totalTime = timer.time + historyTime;

  const changeMaxTime = () => {
    setShowTimeModal(true);
  };

  const nextRandomImage = async (skip = false, _files = files) => {
    try {
      timer.reset();
      timer.pause();

      if (!skip && imageSrc) {
        setHistory((prev) => prev.concat({ ...imageSrc, time: timer.time }));
      }
      const [result] = await Promise.all([
        Promise.resolve().then(
          async (): Promise<{ url: string; pathname: string } | null> => {
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

            return { url, pathname };
          }
        ),
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
      if (result) {
        setImageSrc({
          id: createId(),
          imageSrc: result.url,
          path: result.pathname,
          time: null,
        });
      } else {
        setImageSrc(null);
      }
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

  const imageClassName = cx(
    $.image,
    grayscale.value && $.isGrayscale,
    flippedHorizontal.value && $.isFlippedHorizontal,
    flippedVertical.value && $.isFlippedVertical
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
      <VersionModal />
      <PageLayout
        title={`Total time: ${formatTime(totalTime)}`}
        historyCount={history.length}
        buttons={
          <>
            <Button
              onClick={openFolder}
              loading={loading === 'directory'}
              icon={<Folder />}
              title="Directory"
            >
              <span className={$.text}>
                {hasFilesLoaded ? 'Change directory' : 'Set directory'}
              </span>
            </Button>

            <Button
              onClick={() =>
                changeView(view === 'overview' ? 'app' : 'overview')
              }
              icon={view === 'app' ? <Dashboard /> : <Image />}
              title="View overview"
            >
              <span className={$.text}>
                {view === 'overview' ? 'Back to app' : 'Overview'}
              </span>
            </Button>

            {view === 'overview' && (
              <Button onClick={() => setHistory([])} title="Clear history">
                <span className={$.text}>Clear history</span>
              </Button>
            )}

            {hasFilesLoaded && view === 'app' && (
              <>
                <span className={$.divider} />
                <Button
                  onClick={() => nextRandomImage()}
                  loading={loading === 'file'}
                  icon={<SkipNext />}
                  title="Next"
                >
                  <span className={$.text}>Next</span>
                </Button>
                <Button
                  onClick={() => nextRandomImage(true)}
                  loading={loading === 'file'}
                  icon={<FastForward />}
                  title="Skip"
                >
                  <span className={$.text}>Skip</span>
                </Button>
                <Button
                  onClick={() => autoplay.toggle()}
                  primary={autoplay.value}
                  icon={<Replay />}
                  title="Autoplay"
                >
                  <span className={$.text}>Autoplay</span>
                </Button>

                <span className={$.divider} />

                {view === 'app' && (
                  <>
                    <Button
                      onClick={grayscale.toggle}
                      primary={grayscale.value}
                      icon={<Palette />}
                      title="Grayscale toggle"
                    >
                      <span className={$.text}>Grayscale</span>
                    </Button>
                    <Button
                      onClick={flippedHorizontal.toggle}
                      primary={flippedHorizontal.value}
                      icon={<SwapHoriz />}
                      title="Flip horizontal"
                    >
                      <span className={$.text}>Flip horizontal</span>
                    </Button>
                    <Button
                      onClick={flippedVertical.toggle}
                      primary={flippedVertical.value}
                      icon={<SwapVert />}
                      title="Flip vertical"
                    >
                      <span className={$.text}>Flip vertical</span>
                    </Button>

                    <span className={$.spacer} />
                    <span className={$.divider} />

                    <Button
                      type="button"
                      onClick={changeMaxTime}
                      icon={<Timer />}
                      title="Change time"
                    >
                      <span className={$.text}>
                        {formattedTime} / {formatTime(time)}
                      </span>
                    </Button>
                    <Button
                      onClick={timer.toggle}
                      primary={timer.playing}
                      icon={timer.playing ? <Pause /> : <PlayArrow />}
                      title="Toggle play"
                    >
                      <span className={$.text}>
                        {timer.playing ? 'Pause' : 'Play'}
                      </span>
                    </Button>
                    <Button
                      onClick={timer.reset}
                      icon={<Refresh />}
                      title="Reset timer"
                    >
                      <span className={$.text}>Reset</span>
                    </Button>
                    <Button
                      primary={!muted}
                      onClick={() => setSetting('muted', !muted)}
                      icon={!muted ? <VolumeUp /> : <VolumeMute />}
                      title="Toggle volume"
                    />
                  </>
                )}
              </>
            )}
          </>
        }
        footer={
          <ProgressBar active={timer.playing} progress={timer.time / time} />
        }
      >
        {view === 'app' && imageSrc && (
          <div className={imageClassName}>
            <img src={imageSrc.imageSrc} alt="selected" />
          </div>
        )}
        {view === 'intermission' && (
          <h1 className={$.intermission}>Next coming in {intermissionSeconds}</h1>
        )}
        {view === 'overview' && <OverViewPage images={history} />}
      </PageLayout>
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
    </>
  );
}
