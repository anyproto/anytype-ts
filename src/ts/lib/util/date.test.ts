import { describe, it, expect } from 'vitest';
import * as I from 'Interface';
import UtilDate from './date';

describe('UtilDate', () => {

	describe('timestamp', () => {
		it('should return a Unix timestamp for given date components', () => {
			const ts = UtilDate.timestamp(2024, 1, 1, 0, 0, 0);
			const d = new Date(ts * 1000);

			expect(d.getFullYear()).toBe(2024);
			expect(d.getMonth()).toBe(0); // January
			expect(d.getDate()).toBe(1);
		});

		it('should handle defaults for missing components', () => {
			const ts = UtilDate.timestamp(2024, 6, 15);

			expect(ts).toBeGreaterThan(0);
		});

		it('should handle years less than 1000', () => {
			const ts = UtilDate.timestamp(100, 1, 1);

			expect(ts).toBeLessThan(0);
		});
	});

	describe('isLeapYear', () => {
		it('should return true for years divisible by 4', () => {
			expect(UtilDate.isLeapYear(2024)).toBe(true);
			expect(UtilDate.isLeapYear(2020)).toBe(true);
		});

		it('should return false for years divisible by 100 but not 400', () => {
			expect(UtilDate.isLeapYear(1900)).toBe(false);
			expect(UtilDate.isLeapYear(2100)).toBe(false);
		});

		it('should return true for years divisible by 400', () => {
			expect(UtilDate.isLeapYear(2000)).toBe(true);
			expect(UtilDate.isLeapYear(1600)).toBe(true);
		});

		it('should return false for non-leap years', () => {
			expect(UtilDate.isLeapYear(2023)).toBe(false);
			expect(UtilDate.isLeapYear(2025)).toBe(false);
		});
	});

	describe('getMonthDays', () => {
		it('should return 28 days for February in non-leap year', () => {
			const md = UtilDate.getMonthDays(2023);

			expect(md[2]).toBe(28);
		});

		it('should return 29 days for February in leap year', () => {
			const md = UtilDate.getMonthDays(2024);

			expect(md[2]).toBe(29);
		});

		it('should return 31 days for January', () => {
			const md = UtilDate.getMonthDays(2024);

			expect(md[1]).toBe(31);
		});

		it('should return 30 days for April', () => {
			const md = UtilDate.getMonthDays(2024);

			expect(md[4]).toBe(30);
		});
	});

	describe('date', () => {
		// Use a known timestamp: 2024-07-15 14:30:45 UTC
		const ts = Math.floor(new Date(2024, 6, 15, 14, 30, 45).getTime() / 1000);

		it('should format day of month (j)', () => {
			expect(UtilDate.date('j', ts)).toBe('15');
		});

		it('should format zero-padded day (d)', () => {
			const ts2 = Math.floor(new Date(2024, 0, 5).getTime() / 1000);

			expect(UtilDate.date('d', ts2)).toBe('05');
		});

		it('should format month number (n)', () => {
			expect(UtilDate.date('n', ts)).toBe('7');
		});

		it('should format year (Y)', () => {
			expect(UtilDate.date('Y', ts)).toBe('2024');
		});

		it('should format two-digit year (y)', () => {
			expect(UtilDate.date('y', ts)).toBe('24');
		});

		it('should format hours 24h (H)', () => {
			expect(UtilDate.date('H', ts)).toBe('14');
		});

		it('should format minutes (i)', () => {
			expect(UtilDate.date('i', ts)).toBe('30');
		});

		it('should format seconds (s)', () => {
			expect(UtilDate.date('s', ts)).toBe('45');
		});

		it('should format AM/PM (A)', () => {
			expect(UtilDate.date('A', ts)).toBe('PM');
			const morningTs = Math.floor(new Date(2024, 6, 15, 9, 0, 0).getTime() / 1000);
			expect(UtilDate.date('A', morningTs)).toBe('AM');
		});

		it('should format 12-hour (g)', () => {
			expect(UtilDate.date('g', ts)).toBe('2');
		});

		it('should handle compound formats', () => {
			expect(UtilDate.date('Y-m-d', ts)).toBe('2024-07-15');
		});
	});

	describe('dateFormat', () => {
		it('should return format for MonthAbbrBeforeDay', () => {
			expect(UtilDate.dateFormat(0)).toBe('M d, Y');
		});

		it('should return format for ISO', () => {
			expect(UtilDate.dateFormat(4)).toBe('Y-m-d');
		});

		it('should return format for Short', () => {
			expect(UtilDate.dateFormat(2)).toBe('d.m.Y');
		});

		it('should return format for ShortUS', () => {
			expect(UtilDate.dateFormat(3)).toBe('m.d.Y');
		});
	});

	describe('timeFormat', () => {
		it('should return 12h format', () => {
			expect(UtilDate.timeFormat(0)).toBe('g:i A');
		});

		it('should return 24h format', () => {
			expect(UtilDate.timeFormat(1)).toBe('H:i');
		});

		it('should include seconds when withSeconds is true', () => {
			expect(UtilDate.timeFormat(0, true)).toBe('g:i:s A');
			expect(UtilDate.timeFormat(1, true)).toBe('H:i:s');
		});
	});

	describe('parseDate', () => {
		it('should parse ISO format date', () => {
			const ts = UtilDate.parseDate('2024.07.15', 4); // ISO

			const d = new Date(ts * 1000);
			expect(d.getFullYear()).toBe(2024);
			expect(d.getMonth()).toBe(6); // July
			expect(d.getDate()).toBe(15);
		});

		it('should parse US format date', () => {
			const ts = UtilDate.parseDate('07.15.2024', 3); // ShortUS

			const d = new Date(ts * 1000);
			expect(d.getMonth()).toBe(6);
			expect(d.getDate()).toBe(15);
		});

		it('should parse date with time', () => {
			const ts = UtilDate.parseDate('15.07.2024 14:30:00', 2); // Short (d.m.Y)

			const d = new Date(ts * 1000);
			expect(d.getHours()).toBe(14);
			expect(d.getMinutes()).toBe(30);
		});
	});

	describe('mergeTimeWithDate', () => {
		it('should merge date and time components', () => {
			const datePart = Math.floor(new Date(2024, 6, 15).getTime() / 1000);
			const timePart = Math.floor(new Date(2020, 0, 1, 14, 30, 0).getTime() / 1000);

			const merged = UtilDate.mergeTimeWithDate(datePart, timePart);
			const d = new Date(merged * 1000);

			expect(d.getFullYear()).toBe(2024);
			expect(d.getMonth()).toBe(6);
			expect(d.getDate()).toBe(15);
			expect(d.getHours()).toBe(14);
			expect(d.getMinutes()).toBe(30);
		});
	});

	describe('getCalendarDateParam', () => {
		it('should extract day, month, year from timestamp', () => {
			const ts = Math.floor(new Date(2024, 6, 15).getTime() / 1000);
			const { d, m, y } = UtilDate.getCalendarDateParam(ts);

			expect(d).toBe(15);
			expect(m).toBe(7);
			expect(y).toBe(2024);
		});
	});

	describe('duration', () => {
		it('should return empty string for zero', () => {
			expect(UtilDate.duration(0)).toBe('');
		});

		it('should format seconds', () => {
			expect(UtilDate.duration(30)).toBe('30s');
		});

		it('should format minutes', () => {
			expect(UtilDate.duration(120)).toBe('2min');
		});

		it('should format hours', () => {
			expect(UtilDate.duration(7200)).toBe('2h');
		});

		it('should format days', () => {
			expect(UtilDate.duration(172800)).toBe('2d');
		});

		it('should format years', () => {
			expect(UtilDate.duration(86400 * 365 * 2)).toBe('2y');
		});
	});

	describe('now', () => {
		it('should return a recent timestamp', () => {
			const now = UtilDate.now();
			const jsNow = Math.floor(Date.now() / 1000);

			expect(Math.abs(now - jsNow)).toBeLessThanOrEqual(1);
		});
	});

	describe('today', () => {
		it('should return timestamp for start of today', () => {
			const today = UtilDate.today();
			const d = new Date(today * 1000);

			expect(d.getHours()).toBe(0);
			expect(d.getMinutes()).toBe(0);
			expect(d.getSeconds()).toBe(0);
		});

		it('should match current date', () => {
			const today = UtilDate.today();
			const now = new Date();
			const d = new Date(today * 1000);

			expect(d.getFullYear()).toBe(now.getFullYear());
			expect(d.getMonth()).toBe(now.getMonth());
			expect(d.getDate()).toBe(now.getDate());
		});
	});

	describe('dateWithFormat', () => {
		it('should format with ISO format', () => {
			const ts = Math.floor(new Date(2024, 6, 15).getTime() / 1000);

			expect(UtilDate.dateWithFormat(4, ts)).toBe('2024-07-15');
		});

		it('should format with Short format', () => {
			const ts = Math.floor(new Date(2024, 6, 15).getTime() / 1000);

			expect(UtilDate.dateWithFormat(2, ts)).toBe('15.07.2024');
		});
	});

	describe('timeWithFormat', () => {
		it('should format with 24h format', () => {
			const ts = Math.floor(new Date(2024, 6, 15, 14, 30).getTime() / 1000);

			expect(UtilDate.timeWithFormat(1, ts)).toBe('14:30');
		});
	});

	describe('getDateParam', () => {
		it('should return all date components', () => {
			const ts = Math.floor(new Date(2024, 6, 15, 14, 30, 45).getTime() / 1000);
			const param = UtilDate.getDateParam(ts);

			expect(param.y).toBe(2024);
			expect(param.m).toBe(7);
			expect(param.d).toBe(15);
			expect(param.h).toBe(14);
			expect(param.i).toBe(30);
			expect(param.s).toBe(45);
		});
	});

	describe('isToday', () => {
		it('should return true for current timestamp', () => {
			expect(UtilDate.isToday(UtilDate.now())).toBe(true);
		});

		it('should return false for yesterday', () => {
			expect(UtilDate.isToday(UtilDate.now() - 86400)).toBe(false);
		});
	});

	describe('dateFormat exhaustive', () => {
		it('should return format for MonthAbbrAfterDay', () => {
			expect(UtilDate.dateFormat(1)).toBe('d M, Y');
		});

		it('should return format for Long', () => {
			expect(UtilDate.dateFormat(5)).toBe('F j, Y');
		});

		it('should return format for Nordic', () => {
			expect(UtilDate.dateFormat(6)).toBe('j. M Y');
		});

		it('should return format for European', () => {
			expect(UtilDate.dateFormat(7)).toBe('j.m.Y');
		});

		it('should return format for Default', () => {
			expect(UtilDate.dateFormat(8)).toBe('D, M d, Y');
		});
	});

	describe('parseDate edge cases', () => {
		it('should parse default format (d.m.Y)', () => {
			const ts = UtilDate.parseDate('25.12.2024');

			const d = new Date(ts * 1000);
			expect(d.getMonth()).toBe(11); // December
			expect(d.getDate()).toBe(25);
			expect(d.getFullYear()).toBe(2024);
		});

		it('should clamp month to valid range', () => {
			// Default format (d.m.Y): d=1, m=15 (clamped to 12), y=2024
			const ts = UtilDate.parseDate('1.15.2024');

			const d = new Date(ts * 1000);
			expect(d.getMonth()).toBe(11); // December (clamped from 15)
		});

		it('should clamp day to valid range for month', () => {
			// Default format (d.m.Y): d=31, m=2, y=2024 (Feb 31 clamped to 29 in leap year)
			const ts = UtilDate.parseDate('31.02.2024');

			const d = new Date(ts * 1000);
			expect(d.getDate()).toBeLessThanOrEqual(29);
		});
	});

	describe('dateWithFormat (picker sample distinguishability)', () => {
		// Regression guard for #2208. The settings date-format picker labels every
		// option with `dateWithFormat(id, sample)`. With a symmetric sample (day == month,
		// e.g. 05.05 or 12.12) Short (d/m/Y) and ShortUS (m/d/Y) collapse to the same
		// string, so the user cannot tell the two options apart in the picker. The
		// picker now uses Jul 30, 2020 as a fixed asymmetric sample — this test pins
		// the property that fix relies on.
		it('Short and ShortUS produce distinguishable labels at an asymmetric sample (Jul 30, 2020)', () => {
			const sample = UtilDate.timestamp(2020, 7, 30);
			const short = UtilDate.dateWithFormat(I.DateFormat.Short, sample);
			const shortUS = UtilDate.dateWithFormat(I.DateFormat.ShortUS, sample);

			expect(short).not.toBe(shortUS);
		});

		it('Short and ShortUS collapse on a symmetric date (the bug reported in #2208)', () => {
			const symmetric = UtilDate.timestamp(2026, 5, 5);
			const short = UtilDate.dateWithFormat(I.DateFormat.Short, symmetric);
			const shortUS = UtilDate.dateWithFormat(I.DateFormat.ShortUS, symmetric);

			// This is the bug — documenting it as the negative case so any future
			// change that picks a symmetric sample for the picker would trip the
			// distinguishability test above.
			expect(short).toBe(shortUS);
		});
	});

});
