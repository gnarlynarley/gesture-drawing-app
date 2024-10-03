import React from 'react';

export default function useTimer() {
  const [time, setTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const play = () => setPlaying(true);
  const pause = () => setPlaying(false);
  const toggle = () => setPlaying(!playing);
  const [timeId, setTimeId] = React.useState(() => Math.random());
  const reset = () => {
    setTime(0);
    setTimeId(Math.random());
  };

  React.useEffect(() => {
    let startTime = performance.now();

    if (playing) {
      const intervalId = setInterval(() => {
        const currentTime = performance.now();
        const time = Math.floor((currentTime - startTime) / 1000);
        setTime(time);
      }, 200);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [playing, timeId]);

  return { time, playing, toggle, reset, play, pause };
}
