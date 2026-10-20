export type IdGenerator = () => string;

/** Collision-resistant enough for a single-device local database. */
export const createId: IdGenerator = () => {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${time}-${random}`;
};
