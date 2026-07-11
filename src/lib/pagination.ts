export type Page<T> = { items: T[]; nextCursor: string | null };

export function idCursorArgs(
  cursor?: string | null,
): { skip?: 1; cursor?: { id: string } } {
  return cursor ? { skip: 1, cursor: { id: cursor } } : {};
}
