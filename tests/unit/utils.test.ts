/**
 * Utility Functions Unit Tests
 * Tests for core utility functions and business logic
 */

import { format, parseISO, addDays, isValid } from 'date-fns';

// Mock date utilities and business logic functions
const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const calculateTax = (subtotal: number, taxRate: number): number => {
  return Math.round(subtotal * taxRate * 100) / 100;
};

const generateInvoiceNumber = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4);
  return `INV-${year}${month}-${timestamp}`;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

const parseAddress = (address: string): { street: string; city: string; state: string; zip: string } | null => {
  // Simple address parser for testing
  const parts = address.split(',').map(part => part.trim());
  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1].split(' ');
    return {
      street: parts[0],
      city: parts[1],
      state: stateZip[0] || '',
      zip: stateZip[1] || ''
    };
  }
  return null;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const generatePassword = (length = 12): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

describe('Utility Functions', () => {
  describe('Currency Formatting', () => {
    test('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    test('should handle different currencies', () => {
      expect(formatCurrency(100, 'EUR')).toContain('100.00');
      expect(formatCurrency(100, 'GBP')).toContain('100.00');
    });

    test('should handle negative amounts', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });

    test('should handle decimal precision', () => {
      expect(formatCurrency(99.999)).toBe('$100.00');
      expect(formatCurrency(99.994)).toBe('$99.99');
    });
  });

  describe('Phone Formatting', () => {
    test('should format 10-digit phone numbers', () => {
      expect(formatPhone('2532788692')).toBe('(253) 278-8692');
      expect(formatPhone('1234567890')).toBe('(123) 456-7890');
    });

    test('should handle already formatted numbers', () => {
      expect(formatPhone('(253) 278-8692')).toBe('(253) 278-8692');
    });

    test('should return original for invalid lengths', () => {
      expect(formatPhone('123')).toBe('123');
      expect(formatPhone('12345678901')).toBe('12345678901');
    });

    test('should strip non-digits before formatting', () => {
      expect(formatPhone('253-278-8692')).toBe('(253) 278-8692');
      expect(formatPhone('253.278.8692')).toBe('(253) 278-8692');
    });
  });

  describe('Tax Calculation', () => {
    test('should calculate tax correctly', () => {
      expect(calculateTax(100, 0.1)).toBe(10);
      expect(calculateTax(175, 0.1025)).toBe(17.94);
      expect(calculateTax(50, 0.0875)).toBe(4.38);
    });

    test('should handle zero amounts', () => {
      expect(calculateTax(0, 0.1)).toBe(0);
    });

    test('should handle zero tax rate', () => {
      expect(calculateTax(100, 0)).toBe(0);
    });

    test('should round to nearest cent', () => {
      expect(calculateTax(33.33, 0.0999)).toBe(3.33);
    });
  });

  describe('Invoice Number Generation', () => {
    test('should generate valid invoice numbers', () => {
      const invoiceNumber = generateInvoiceNumber();
      expect(invoiceNumber).toMatch(/^INV-\d{6}-\d{4}$/);
    });

    test('should use current year and month', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const invoiceNumber = generateInvoiceNumber(now);
      expect(invoiceNumber).toContain(`INV-${year}${month}`);
    });

    test('should generate unique numbers', async () => {
      const number1 = generateInvoiceNumber();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const number2 = generateInvoiceNumber();
      expect(number1).not.toBe(number2);
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'valid+email@test.org',
        'test123@gmail.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'spaces in@email.com',
        'user@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Phone Validation', () => {
    test('should validate correct phone numbers', () => {
      const validPhones = [
        '2532788692',
        '12532788692',
        '(253) 278-8692',
        '253-278-8692',
        '+1 253 278 8692'
      ];

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    test('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        '253-278-869',
        'not-a-phone',
        ''
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });
  });

  describe('Address Parsing', () => {
    test('should parse complete addresses', () => {
      const address = '123 Main St, Tacoma, WA 98401';
      const parsed = parseAddress(address);

      expect(parsed).toEqual({
        street: '123 Main St',
        city: 'Tacoma',
        state: 'WA',
        zip: '98401'
      });
    });

    test('should handle incomplete addresses', () => {
      const address = '123 Main St';
      const parsed = parseAddress(address);
      expect(parsed).toBeNull();
    });

    test('should handle extra spaces', () => {
      const address = ' 123 Main St , Tacoma , WA 98401 ';
      const parsed = parseAddress(address);

      expect(parsed?.street).toBe('123 Main St');
      expect(parsed?.city).toBe('Tacoma');
    });
  });

  describe('Distance Calculation', () => {
    test('should calculate distance between coordinates', () => {
      // Tacoma, WA to Seattle, WA (approximately 31 miles)
      const tacomaLat = 47.2529;
      const tacomaLon = -122.4443;
      const seattleLat = 47.6062;
      const seattleLon = -122.3321;

      const distance = calculateDistance(tacomaLat, tacomaLon, seattleLat, seattleLon);
      expect(distance).toBeGreaterThan(24);
      expect(distance).toBeLessThan(35);
    });

    test('should return zero for same coordinates', () => {
      const distance = calculateDistance(47.2529, -122.4443, 47.2529, -122.4443);
      expect(distance).toBe(0);
    });

    test('should handle international distances', () => {
      // New York to London (approximately 3459 miles)
      const nyLat = 40.7128;
      const nyLon = -74.0060;
      const londonLat = 51.5074;
      const londonLon = -0.1278;

      const distance = calculateDistance(nyLat, nyLon, londonLat, londonLon);
      expect(distance).toBeGreaterThan(3400);
      expect(distance).toBeLessThan(3500);
    });
  });

  describe('Password Generation', () => {
    test('should generate passwords of correct length', () => {
      expect(generatePassword(8).length).toBe(8);
      expect(generatePassword(16).length).toBe(16);
      expect(generatePassword().length).toBe(12); // default
    });

    test('should generate unique passwords', () => {
      const password1 = generatePassword();
      const password2 = generatePassword();
      expect(password1).not.toBe(password2);
    });

    test('should include different character types', () => {
      const password = generatePassword(100); // Large password for better chance of all types
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/[a-z]/); // lowercase
      expect(password).toMatch(/[0-9]/); // numbers
      expect(password).toMatch(/[!@#$%^&*]/); // special chars
    });
  });

  describe('Text Utilities', () => {
    test('should create slugs from text', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test & Demo!')).toBe('test-demo');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });

    test('should handle special characters in slugs', () => {
      expect(slugify('café-résumé')).toBe('caf-rsum');
      expect(slugify('100% Pure')).toBe('100-pure');
    });

    test('should truncate text correctly', () => {
      expect(truncateText('Hello World', 5)).toBe('He...');
      expect(truncateText('Short', 10)).toBe('Short');
      expect(truncateText('Exactly ten!', 12)).toBe('Exactly ten!');
    });

    test('should handle edge cases in truncation', () => {
      expect(truncateText('', 5)).toBe('');
      expect(truncateText('ABC', 3)).toBe('ABC');
      expect(truncateText('ABCD', 3)).toBe('...');
    });
  });

  describe('Date Utilities', () => {
    test('should work with date-fns functions', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Use noon UTC to avoid timezone issues
      expect(format(date, 'yyyy-MM-dd')).toBe('2025-01-15');
      expect(format(date, 'MMM dd, yyyy')).toBe('Jan 15, 2025');
    });

    test('should parse ISO dates', () => {
      const parsed = parseISO('2025-01-15T09:00:00Z');
      expect(isValid(parsed)).toBe(true);
      expect(format(parsed, 'yyyy-MM-dd')).toBe('2025-01-15');
    });

    test('should add days to dates', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Use noon UTC
      const futureDate = addDays(date, 30);
      expect(format(futureDate, 'yyyy-MM-dd')).toBe('2025-02-14');
    });
  });
});