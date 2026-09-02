export function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function validateBatchCount(countInput: string | number | undefined | null): number {
  if (countInput === undefined || countInput === null || countInput === '') {
    throw new Error('Count parameter is required');
  }
  let count: number;
  if (typeof countInput === 'number') {
    count = countInput;
  } else {
    count = parseInt(countInput, 10);
  }
  if (isNaN(count)) {
    throw new Error('Count must be a valid number');
  }
  if (count <= 0) {
    throw new Error('Count must be greater than zero');
  }
  if (count > 500) {
    throw new Error('Maksimal batch generate adalah 500 kartu sekaligus');
  }
  return count;
}

export function determineIsActive(targetUrl?: string | null): boolean {
  return typeof targetUrl === 'string' && targetUrl.trim().length > 0;
}

export interface PaginationParams {
  limit: number;
  page: number;
  offset: number;
  status: 'all' | 'active' | 'unassigned';
  search: string | null;
}

export function parsePaginationParams(query: (key: string) => string | undefined): PaginationParams {
  const limitStr = query('limit') || '20';
  const pageStr = query('page') || '1';
  
  let limit = parseInt(limitStr, 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  limit = Math.min(limit, 100); // max 100

  let page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) page = 1;

  const offset = (page - 1) * limit;

  let statusRaw = query('status') || 'all';
  let status: 'all' | 'active' | 'unassigned' = 'all';
  if (statusRaw === 'active' || statusRaw === 'unassigned') {
    status = statusRaw;
  }

  const searchRaw = query('search');
  const search = searchRaw ? searchRaw.trim() : null;

  return {
    limit,
    page,
    offset,
    status,
    search: search && search.length > 0 ? search : null
  };
}

/**
 * Formats card label with sequential number and optional free string.
 * Format: K-XXXXXX-[free string]
 * If free string is empty/null, outputs K-XXXXXX- (with trailing hyphen).
 * Pads to minimum 6 digits (000001), dynamically expands if > 6 digits.
 */
export function formatCardLabel(sequenceNumber: number, freeString?: string | null): string {
  const safeSeq = Math.max(1, Math.floor(sequenceNumber || 1));
  const padded = String(safeSeq).padStart(6, '0');
  const base = `K-${padded}-`;
  const suffix = freeString ? freeString.trim() : '';
  return suffix.length > 0 ? `${base}${suffix}` : base;
}

/**
 * Extracts the highest sequence number from a list of card labels.
 * Handles patterns like 'K-000001-Example', 'K-000045-', 'K-000020'
 */
export function extractMaxSequenceFromLabels(labels: (string | null | undefined)[]): number {
  let maxSeq = 0;
  for (const label of labels) {
    if (!label) continue;
    const match = label.match(/^K-(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  return maxSeq;
}
