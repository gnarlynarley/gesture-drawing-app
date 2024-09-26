import cx from '../utils/cx';
import $ from './ProgressBar.module.scss';

type Props = {
  active: boolean;
  progress: number;
};

export default function ProgressBar({ active, progress }: Props) {
  return (
    <div
      className={cx($.wrapper, active && $.isActive)}
      style={{ ['--progress' as any]: Math.min(Math.max(progress, 0), 1) }}
    >
      <div className={$.bar} />
    </div>
  );
}
