import cx from '../utils/cx';
import $ from './Button.module.scss';

type Props = React.PropsWithChildren<{
  primary?: boolean;
  onClick?: () => void;
  type?: 'submit' | 'reset' | 'button';
  loading?: boolean;
  icon?: JSX.Element;
}>;

export default function Button({
  type = 'button',
  onClick,
  primary,
  children,
  loading,
  icon,
}: Props) {
  return (
    <button
      type={type}
      className={cx(
        $.button,
        primary && $.isPrimary,
        loading && $.isLoading,
        icon && $.hasIcon
      )}
      onClick={() => onClick?.()}
    >
      {loading && <span className={$.spinner} />}
      {icon && <span className={$.inner}>{icon}</span>}
      <span className={$.inner}>{children}</span>
    </button>
  );
}
