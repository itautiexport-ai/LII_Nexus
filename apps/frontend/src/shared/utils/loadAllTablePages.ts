/** Used only by Delegation/List Leads: filters must see every authorized API page. */
export async function loadAllTablePages<T extends { id: string }>(
  fetchPage: (page: number, pageSize: number) => Promise<{ items: T[]; totalItems: number }>,
  isCurrent: () => boolean = () => true,
): Promise<T[]> {
  const items: T[] = [];
  const seen = new Set<string>();
  let page = 1;
  let expectedTotal = 0;
  do {
    if (!isCurrent()) throw new Error('Table load cancelled');
    const result = await fetchPage(page, 500);
    if (!isCurrent()) throw new Error('Table load cancelled');
    const total = Number(result.totalItems);
    if (!Number.isSafeInteger(total) || total < 0 || !Array.isArray(result.items)) {
      throw new Error('Could not read the complete list. Please retry.');
    }
    if (page === 1) expectedTotal = total;
    const previousCount = items.length;
    for (const item of result.items) {
      if (!seen.has(item.id)) { seen.add(item.id); items.push(item); }
    }
    if (items.length >= expectedTotal) return items;
    // Never present a silently truncated/repeated page as a complete searchable list.
    if (items.length === previousCount) throw new Error('The list changed while loading. Please retry.');
    page++;
  } while (true);
}
