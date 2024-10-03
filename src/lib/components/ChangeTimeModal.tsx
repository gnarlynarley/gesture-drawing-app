import React from 'react';
import Modal from './Modal';
import Input from './Input';

type Props = {
  initialMaxTime: number;
  onSubmit(value: number): void;
  onCancel(): void;
};

export default function ChangeMaxTimeModal({
  initialMaxTime,
  onSubmit,
  onCancel,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Modal
      title="Change time duration"
      onSubmit={() => onSubmit(inputRef.current!.valueAsNumber)}
      onCancel={onCancel}
    >
      <Input
        type="number"
        ref={inputRef}
        label="Time duration (in seconds)"
        defaultValue={initialMaxTime}
      />
    </Modal>
  );
}
