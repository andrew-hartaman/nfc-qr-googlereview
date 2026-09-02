export function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
