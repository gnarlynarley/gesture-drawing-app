import sound from './ding.mp3?url';

const audio = new Audio(sound);

export default function playDing() {
  audio.play();

  return () => {
    audio.pause();
    audio.currentTime = 0;
  };
}
