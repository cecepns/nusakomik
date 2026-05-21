/** Backend vote_type / chapter reaction_type keys (unchanged for API compatibility). */
export const REACTION_OPTIONS = [
  { id: 'senang', emoji: '😍', label: 'Love' },
  { id: 'biasaAja', emoji: '😝', label: 'Funny' },
  { id: 'kecewa', emoji: '😯', label: 'Surprised' },
  { id: 'marah', emoji: '😡', label: 'Angry' },
  { id: 'sedih', emoji: '😭', label: 'Sad' },
];

export const emptyReactionCounts = () =>
  REACTION_OPTIONS.reduce((acc, { id }) => {
    acc[id] = 0;
    return acc;
  }, {});

export function sumReactionCounts(data) {
  if (!data || typeof data !== 'object') return 0;
  return REACTION_OPTIONS.reduce((sum, { id }) => sum + Number(data[id] || 0), 0);
}
