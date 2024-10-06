import { getCurrentWindow } from '@tauri-apps/api/window';
import { Close, Fullscreen, Minimize } from '@material-ui/icons';
import $ from './MenuBar.module.scss';

const currentWindow = getCurrentWindow();

export default function MenuBar() {
  const minimize = () => {
    currentWindow.minimize();
  };
  const maximize = () => {
    currentWindow.toggleMaximize();
  };
  const close = () => {
    currentWindow.close();
  };

  return (
    <div data-tauri-drag-region className={$.container}>
      <button className={$.button} type="button" onClick={minimize}>
        <Minimize />
      </button>
      <button className={$.button} type="button" onClick={maximize}>
        <Fullscreen />
      </button>
      <button className={$.button} type="button" onClick={close}>
        <Close />
      </button>
    </div>
  );
}