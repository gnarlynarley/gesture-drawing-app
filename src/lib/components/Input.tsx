import React from 'react';
import $ from './Input.module.scss';

type Props = {
  label: string;
} & React.ComponentProps<'input'>;

const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, ...rest }, ref) => {
    const id = React.useId();
    return (
      <div className={$.wrapper}>
        <label htmlFor={id}>{label}</label>
        <input id={id} ref={ref} {...rest} className={$.input} />
      </div>
    );
  }
);

export default Input;
