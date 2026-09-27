export interface ConfidenceScore {
  value: number; // 0.0 to 1.0
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXEMPLARY';
}

export function createConfidenceScore(rawRatio: number): ConfidenceScore {
  const clamped = Math.max(0.0, Math.min(1.0, rawRatio));
  let level: ConfidenceScore['level'] = 'LOW';
  if (clamped >= 0.85) {
    level = 'EXEMPLARY';
  } else if (clamped >= 0.70) {
    level = 'HIGH';
  } else if (clamped >= 0.45) {
    level = 'MEDIUM';
  }
  return {
    value: Number(clamped.toFixed(2)),
    level,
  };
}
