export type SortableRecord = { sort_order: number };

/** Stable numeric ordering using the database's canonical sort_order field. */
export function sortBySortOrder<T extends SortableRecord>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}
