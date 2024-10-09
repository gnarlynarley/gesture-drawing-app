export default function formatTime(time: number) {
  const seconds = time % 60;
  const minutes = Math.floor(time / 60);
  const hours = Math.floor(minutes / 60);

  if (hours) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
