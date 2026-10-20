type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

// Use a fresh, consistently ordered query for every page. Existing filters
// and database access policies stay with the caller.
export async function fetchAllLeadRows<T = any>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<PageResult<T>> {
  const rows: T[] = [];
  const pageSize = 500;
  while (true) {
    const { data, error } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error) return { data: null, error };
    if (!data?.length) return { data: rows, error: null };
    rows.push(...data);
  }
}