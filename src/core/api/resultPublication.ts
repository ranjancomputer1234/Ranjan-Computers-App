/** A result the learner is allowed to see. Unpublished attempts stay out of history. */
export function isPublishedResult(row: Record<string, unknown>): boolean {
  if (row.resultPublished === false || row.published === false || row.isPublished === false) return false;
  const status = typeof row.status === 'string' ? row.status.toLowerCase() : '';
  const visibility = typeof row.visibility === 'string' ? row.visibility.toLowerCase() : '';
  if (status === 'draft' || status === 'unpublished' || status === 'result_unpublished') return false;
  if (visibility === 'draft' || visibility === 'unpublished') return false;
  return true;
}
