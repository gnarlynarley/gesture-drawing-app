import { getCurrentWindow } from '@tauri-apps/api/window';
import { Close, Fullscreen, Minimize } from '@material-ui/icons';
import $ from './MenuBar.module.scss';

type Props = {
  title?: string;
  historyCount?: number;
};

const currentWindow = getCurrentWindow();

export default function MenuBar({ title, historyCount }: Props) {
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
      <div className={$.title}>
        {title && <span>{title}</span>}
        {historyCount !== 0 && (
          <div className={$.count}>Count: {historyCount}</div>
        )}
      </div>
      <div className={$.spacer} />
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
