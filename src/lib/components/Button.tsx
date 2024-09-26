import cx from '../utils/cx';
import $ from './Button.module.scss';

type Props = React.PropsWithChildren<{
  primary?: boolean;
  onClick?: () => void;
  type?: 'submit' | 'reset' | 'button';
  loading?: boolean;
}>;

export default function Button({
  type = 'button',
  onClick,
  primary,
  children,
  loading,
}: Props) {
  return (
    <button
      type={type}
      className={cx($.button, primary && $.isPrimary, loading && $.isLoading)}
      onClick={() => onClick?.()}
    >
      {loading && <span className={$.spinner} />}
      <span className={$.inner}>{children}</span>
    </button>
  );
}
