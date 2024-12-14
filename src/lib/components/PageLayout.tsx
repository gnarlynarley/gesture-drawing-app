import React from 'react';
import MenuBar from './MenuBar';
import $ from './PageLayout.module.scss';

type Props = React.PropsWithChildren<{
  title?: string;
  historyCount?: number;
  buttons: JSX.Element;
  footer?: JSX.Element;
}>;

export default function PageLayout({
  title,
  historyCount,
  buttons,
  footer,
  children,
}: Props) {
  return (
    <div className={$.wrapper}>
      <div className={$.menubar}>
        <MenuBar title={title} historyCount={historyCount} />
      </div>
      <div className={$.toolbar}>{buttons}</div>

      <div className={$.content}>{children}</div>

      {footer && <div className={$.footer}>{footer}</div>}
    </div>
  );
}
