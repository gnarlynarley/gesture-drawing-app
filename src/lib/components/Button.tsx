import cx from '../utils/cx';
import $ from './Button.module.scss';

type Props = React.PropsWithChildren<{
  primary?: boolean;
  onClick?: () => void;
}>;

export default function Button({ onClick, primary, children }: Props) {
  return (
    <button
      className={cx($.button, primary && $.isPrimary)}
      onClick={() => onClick?.()}
    >
      {children}
    </button>
  );
}
