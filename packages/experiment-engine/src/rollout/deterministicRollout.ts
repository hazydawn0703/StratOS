export const deterministicRollout = (seed: string): number => {
  let hash = 0;
  for (const ch of seed) hash = (hash + ch.charCodeAt(0)) % 100;
  return hash;
};
