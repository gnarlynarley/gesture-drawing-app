import React from 'react';
import { getVersion } from '@tauri-apps/api/app';
import useSettings from '../hooks/useSettings';
import Modal from './Modal';

async function fetchLatestVersion(signal: AbortSignal) {
  const response = await fetch(
    `https://api.github.com/repos/gnarlynarley/gesture-drawing-app/releases`,
    { signal }
  );
  const data = await response.json();
  const latestVersionName = data?.[0]?.name;
  const latestVersion =
    typeof latestVersionName === 'string'
      ? latestVersionName.split(' ').pop()?.replace('v', '')
      : null;

  return latestVersion ?? null;
}

export default function VersionModal() {
  const {
    settings: { loaded, skipVersion },
    setSetting,
  } = useSettings();
  const [closed, setClosed] = React.useState(false);
  const [currentVersion, setCurrentVersion] = React.useState<null | string>(
    null
  );
  const [latestVersion, setLatestVersion] = React.useState<null | string>(null);

  const close = () => {
    setClosed(true);
  };

  const skip = () => {
    setClosed(true);
    setSetting('skipVersion', latestVersion);
  };

  React.useEffect(() => {
    getVersion().then(setCurrentVersion);
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    const abortController = new AbortController();
    fetchLatestVersion(abortController.signal).then(setLatestVersion);

    return () => {
      abortController.abort();
    };
  }, [loaded]);

  const open =
    !closed &&
    currentVersion !== null &&
    latestVersion !== null &&
    currentVersion !== latestVersion &&
    latestVersion !== skipVersion;

  if (!open) return null;

  return (
    <Modal
      title="New version is available"
      onCancel={close}
      onSubmit={skip}
      cancelLabel="Close"
      submitLabel="Skip version"
    >
      <p>
        Download and install the latest version{' '}
        <a
          target="_blank"
          href="https://github.com/gnarlynarley/gesture-drawing-app/releases"
        >
          here
        </a>
      </p>
    </Modal>
  );
}
