import cx from '../utils/cx';
import $ from './Button.module.scss';

type Props = React.PropsWithChildren<{
  primary?: boolean;
  title?: string;
  onClick?: () => void;
  type?: 'submit' | 'reset' | 'button';
  loading?: boolean;
  icon?: JSX.Element;
}>;

export default function Button({
  type = 'button',
  title,
  onClick,
  primary,
  children,
  loading,
  icon,
}: Props) {
  return (
    <button
      title={title}
      type={type}
      className={cx(
        $.button,
        primary && $.isPrimary,
        loading && $.isLoading,
        icon && $.hasIcon,
        !!children && $.hasContent
      )}
      onClick={() => onClick?.()}
    >
      {loading && <span className={$.spinner} />}
      {icon && <span className={$.inner}>{icon}</span>}
      {children && <span className={$.inner}>{children}</span>}
    </button>
  );
}
