export function getIdsInProgressFromTimestamps(timestamps: { [id: string]: string }) {
  const now = Date.now();
  return Object.keys(timestamps).filter((id) => {
    const timestamp = timestamps[id];
    return ((now - new Date(timestamp).getTime()) / 1000) < 10;
  });
}