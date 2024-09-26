import React from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import $ from './Modal.module.scss';

type Props = React.PropsWithChildren<{
  onSubmit(): void;
  onCancel(): void;
  title: string;
}>;

const modalContainer = document.getElementById('dialog-container')!;

export default function Modal({ onSubmit, onCancel, title, children }: Props) {
  return createPortal(
    <div className={$.container}>
      <div className={$.modal}>
        <header>
          <h1>{title}</h1>
        </header>
        <main>
          <form
            method="dialog"
            onSubmit={(ev) => {
              ev.preventDefault();
              onSubmit();
            }}
          >
            {children}
            <div className={$.buttons}>
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="submit" onClick={onSubmit} primary>
                Submit
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>,
    modalContainer
  );
}
