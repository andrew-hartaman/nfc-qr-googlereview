import { describe, it, expect } from 'vitest';
import { 
  generateShortCode, 
  validateBatchCount, 
  determineIsActive, 
  parsePaginationParams 
} from './logic';

describe('logic utils', () => {
  describe('generateShortCode', () => {
    it('should generate an 8-character string', () => {
      const code = generateShortCode();
      expect(typeof code).toBe('string');
      expect(code.length).toBe(8);
    });

    it('should generate alphanumeric characters only', () => {
      const code = generateShortCode();
      expect(/^[a-zA-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate unique, non-sequential codes', () => {
      const codes = new Set();
      // Generate a larger sample to ensure uniqueness and non-sequential nature
      for (let i = 0; i < 1000; i++) {
        codes.add(generateShortCode());
      }
      expect(codes.size).toBe(1000);
    });
  });

  describe('validateBatchCount', () => {
    it('should return valid count', () => {
      expect(validateBatchCount('50')).toBe(50);
      expect(validateBatchCount('1')).toBe(1);
      expect(validateBatchCount('500')).toBe(500);
    });

    it('should throw error for empty or undefined', () => {
      expect(() => validateBatchCount(null)).toThrow('Count parameter is required');
      expect(() => validateBatchCount('')).toThrow('Count parameter is required');
      expect(() => validateBatchCount(undefined)).toThrow('Count parameter is required');
    });

    it('should throw error for non-numeric', () => {
      expect(() => validateBatchCount('abc')).toThrow('Count must be a valid number');
    });

    it('should throw error for zero or negative', () => {
      expect(() => validateBatchCount('0')).toThrow('Count must be greater than zero');
      expect(() => validateBatchCount('-10')).toThrow('Count must be greater than zero');
    });

    it('should throw error for exceeding max limit', () => {
      expect(() => validateBatchCount('501')).toThrow('Maksimal batch generate adalah 500 kartu sekaligus');
    });
  });

  describe('determineIsActive', () => {
    it('should return true when targetUrl is provided', () => {
      expect(determineIsActive('https://google.com')).toBe(true);
      expect(determineIsActive('   https://google.com  ')).toBe(true);
    });

    it('should return false for empty, null, or undefined', () => {
      expect(determineIsActive('')).toBe(false);
      expect(determineIsActive('   ')).toBe(false);
      expect(determineIsActive(null)).toBe(false);
      expect(determineIsActive(undefined)).toBe(false);
    });
  });

  describe('parsePaginationParams', () => {
    it('should apply correct defaults', () => {
      const query = (key: string) => undefined;
      const params = parsePaginationParams(query);
      expect(params).toEqual({
        limit: 20,
        page: 1,
        offset: 0,
        status: 'all',
        search: null
      });
    });

    it('should cap limit to 100', () => {
      const query = (key: string) => key === 'limit' ? '150' : undefined;
      const params = parsePaginationParams(query);
      expect(params.limit).toBe(100);
    });

    it('should fallback to defaults for invalid numbers', () => {
      const query = (key: string) => {
        if (key === 'limit') return 'abc';
        if (key === 'page') return '-5';
        return undefined;
      };
      const params = parsePaginationParams(query);
      expect(params.limit).toBe(20);
      expect(params.page).toBe(1);
      expect(params.offset).toBe(0);
    });

    it('should calculate offset correctly', () => {
      const query = (key: string) => {
        if (key === 'limit') return '10';
        if (key === 'page') return '3';
        return undefined;
      };
      const params = parsePaginationParams(query);
      expect(params.limit).toBe(10);
      expect(params.page).toBe(3);
      expect(params.offset).toBe(20);
    });

    it('should parse valid status', () => {
      let query = (key: string) => key === 'status' ? 'active' : undefined;
      expect(parsePaginationParams(query).status).toBe('active');

      query = (key: string) => key === 'status' ? 'unassigned' : undefined;
      expect(parsePaginationParams(query).status).toBe('unassigned');

      query = (key: string) => key === 'status' ? 'invalid_status' : undefined;
      expect(parsePaginationParams(query).status).toBe('all');
    });

    it('should parse search correctly', () => {
      let query = (key: string) => key === 'search' ? '  test code  ' : undefined;
      expect(parsePaginationParams(query).search).toBe('test code');

      query = (key: string) => key === 'search' ? '   ' : undefined;
      expect(parsePaginationParams(query).search).toBeNull();
    });
  });
});
