export function xpToLevel(xp: number) {
  return Math.floor(xp / 20);
}

export function levelToXp(level: number) {
  return level * 20;
}

export function xpRequiredForNextLevel(level: number) {
  return levelToXp(level + 1);
}