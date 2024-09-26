import cx from '../utils/cx';
import $ from './ProgressBar.module.scss';

type Props = {
  active: boolean;
  progress: number;
};

export default function ProgressBar({ active, progress }: Props) {
  const isDone = progress >= 1;
  return (
    <div
      className={cx($.wrapper, active && $.isActive, isDone && $.isDone)}
      style={{ ['--progress' as any]: Math.min(Math.max(progress, 0), 1) }}
    >
      <div className={$.bar} />
    </div>
  );
}
