export interface TimestampRange {
  startSeconds: number;
  endSeconds: number;
}

export function createTimestampRange(startSeconds: number, endSeconds: number): TimestampRange {
  if (startSeconds < 0 || endSeconds < 0) {
    throw new Error('Timestamp values cannot be negative');
  }
  if (startSeconds >= endSeconds) {
    throw new Error('Start timestamp must be strictly less than end timestamp');
  }
  return {
    startSeconds: Number(startSeconds.toFixed(3)),
    endSeconds: Number(endSeconds.toFixed(3)),
  };
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

export function calculateDuration(range: TimestampRange): number {
  return Number((range.endSeconds - range.startSeconds).toFixed(3));
}
