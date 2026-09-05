export async function fetchAllPages(fetchPage, { pageSize = 100 } = {}) {
  const all = []
  let pageNum = 1
  let totalPages = 1

  while (pageNum <= totalPages) {
    const response = await fetchPage({ pageNum, pageSize })
    all.push(...(response.data ?? []))
    totalPages = response.pagination?.totalPages ?? 1
    pageNum += 1
  }

  return all
}
