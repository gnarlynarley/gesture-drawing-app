import React from 'react';

export default function useTimer() {
  const [time, setTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const play = () => setPlaying(true);
  const pause = () => setPlaying(false);
  const toggle = () => setPlaying(!playing);
  const reset = () => {
    setTime(0);
  };

  React.useEffect(() => {
    if (playing) {
      let lastTime = performance.now();
      const intervalId = setInterval(() => {
        const currentTime = performance.now();
        const difference = currentTime - lastTime;
        lastTime = currentTime;
        setTime((t) => t + difference);
      }, 500);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [playing]);

  return { time: Math.floor(time / 1000), playing, toggle, reset, play, pause };
}
