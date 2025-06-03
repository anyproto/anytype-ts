import { I, U, J, S, translate } from 'Lib';

/**
 * Utility class for date and time manipulation, formatting, and calculations.
 * Provides methods for parsing, formatting, and working with dates and times.
 */
class UtilDate {

	/**
	 * Returns the current time as a Unix timestamp (seconds since epoch).
	 * @returns {number} The current Unix timestamp.
	 */
	now (): number {
		const date = new Date();
		const timestamp = Math.floor(date.getTime() / 1000);

		return timestamp;
	};

	/**
	 * Returns a Unix timestamp for the given date and time components.
	 * @param {number} [y] - Year.
	 * @param {number} [m] - Month (1-12).
	 * @param {number} [d] - Day of month.
	 * @param {number} [h] - Hour.
	 * @param {number} [i] - Minute.
	 * @param {number} [s] - Second.
	 * @returns {number} The Unix timestamp.
	 */
	timestamp (y?: number, m?: number, d?: number, h?: number, i?: number, s?: number): number {
		y = Number(y) || 0;
		m = (Number(m) || 0) - 1;
		d = Number(d) || 0;
		h = Number(h) || 0;
		i = Number(i) || 0;
		s = Number(s) || 0;

		let t: Date = null;

		if ((y >= 0) && (y < 1000)) { 
			t = new Date(y + 1000, m, d, h, i, s, 0);
			t.setUTCFullYear(t.getFullYear() - 1000); 
		} else {
			t = new Date(y, m, d, h, i, s, 0);
		};

		return Math.floor(t.getTime() / 1000);
	};

	/**
	 * Returns the Unix timestamp for the start of today.
	 * @returns {number} The Unix timestamp for today.
	 */
	today () {
		const t = this.now();
		const { d, m, y } = this.getCalendarDateParam(t);

		return this.timestamp(y, m, d);
	};

	/**
	 * Parses a date string into a Unix timestamp, using the specified format.
	 * @param {string} value - The date string to parse.
	 * @param {I.DateFormat} [format] - The date format.
	 * @returns {number} The parsed Unix timestamp.
	 */
	parseDate (value: string, format?: I.DateFormat): number {
		const [ date, time ] = String(value || '').split(' ');

		let d: any = 0;
		let m: any = 0;
		let y: any = 0;
		let h: any = 0;
		let i: any = 0;
		let s: any = 0;

		switch (format) {
			case I.DateFormat.ISO: {
				[ y, m, d ] = String(date || '').split('.');
				break;
			};

			case I.DateFormat.ShortUS: {
				[ m, d, y ] = String(date || '').split('.');
				break;
			};

			default: {
				[ d, m, y ] = String(date || '').split('.');
				break;
			};
		};

		[ h, i, s ] = String(time || '').split(':');

		y = Number(y) || 0;
		m = Number(m) || 0;
		d = Number(d) || 0;
		h = Number(h) || 0;
		i = Number(i) || 0;
		s = Number(s) || 0;

		m = Math.min(12, Math.max(1, m));

		let maxDays = J.Constant.monthDays[m];
		if ((m == 2) && (this.isLeapYear(y))) {
			maxDays = 29;
		};
		d = Math.min(maxDays, Math.max(1, d));
		h = Math.min(24, Math.max(0, h));
		i = Math.min(60, Math.max(0, i));
		s = Math.min(60, Math.max(0, s));

		return this.timestamp(y, m, d, h, i, s);
	};

	/**
	 * Formats a Unix timestamp using the given format string.
	 * @param {string} format - The format string.
	 * @param {number} timestamp - The Unix timestamp.
	 * @returns {string} The formatted date string.
	 */
	date (format: string, timestamp: number) {
		timestamp = Number(timestamp) || 0;

		const d = new Date(timestamp * 1000);

		const pad = (n: number, c: number) => {
			let s = String(n);
			if ((s = s + '').length < c ) {
				++c;
				const m = c - s.length;
				return new Array(m).join('0') + s;
			} else {
				return s;
			};
		};

		const f: any = {
			// Day
			d: () => {
				return pad(f.j(), 2);
			},
			D: () => {
				const t = f.l(); 
				return t.substring(0,3);
			},
			j: () => {
				return d.getDate();
			},
			// Month
			F: () => {
				return translate(`month${f.n()}`);
			},
			m: () => {
				return pad(f.n(), 2);
			},
			M: () => {
				return f.F().substring(0, 3);
			},
			n: () => {
				return d.getMonth() + 1;
			},
			// Year
			Y: () => {
				return d.getFullYear();
			},
			y: () => {
				return (d.getFullYear() + '').slice(2);
			},
			// Time
			a: () => {
				return d.getHours() > 11 ? 'pm' : 'am';
			},
			A: () => {
				return d.getHours() > 11 ? 'PM' : 'AM';
			},
			g: () => {
				return d.getHours() % 12 || 12;
			},
			h: () => {
				return pad(f.g(), 2);
			},
			H: () => {
				return pad(d.getHours(), 2);
			},
			i: () => {
				return pad(d.getMinutes(), 2);
			},
			s: () => {
				return pad(d.getSeconds(), 2);
			},
			w: () => {
				return d.getDay();
			},
			N: () => {
				const w = f.w();
				return w == 0 ? 7 : w;
			},
			l: () => {
				return translate(`day${f.N()}`);
			},
		};
		return format.replace(/[\\]?([a-zA-Z])/g, (t: string, s: string) => {
			let ret = null;
			if (t != s) {
				ret = s;
			} else if (f[s]) {
				ret = f[s]();
			} else {
				ret = s;
			};
			return ret;
		});
	};

	/**
	 * Returns the date format string for a given I.DateFormat value.
	 * @param {I.DateFormat} v - The date format enum value.
	 * @returns {string} The format string.
	 */
	dateFormat (v: I.DateFormat): string {
		let f = '';
		switch (v) {
			default:
			case I.DateFormat.MonthAbbrBeforeDay:	 f = 'M d, Y'; break;
			case I.DateFormat.MonthAbbrAfterDay:	 f = 'd M, Y'; break;
			case I.DateFormat.Short:				 f = 'd.m.Y'; break;
			case I.DateFormat.ShortUS:				 f = 'm.d.Y'; break;
			case I.DateFormat.ISO:					 f = 'Y-m-d'; break;
			case I.DateFormat.Long:					 f = 'F j, Y'; break;
			case I.DateFormat.Nordic:				 f = 'j. M Y'; break;
			case I.DateFormat.European:				 f = 'j.m.Y'; break;
			case I.DateFormat.Default:				 f = 'D, M d, Y'; break;
		};
		return f;
	};

	/**
	 * Formats a Unix timestamp using a predefined date format.
	 * @param {I.DateFormat} f - The date format enum value.
	 * @param {number} t - The Unix timestamp.
	 * @returns {string} The formatted date string.
	 */
	dateWithFormat (f: I.DateFormat, t: number): string {
		return this.date(this.dateFormat(f), t);
	};

	/**
	 * Returns the time format string for a given I.TimeFormat value.
	 * @param {I.TimeFormat} v - The time format enum value.
	 * @returns {string} The format string.
	 */
	timeFormat (v: I.TimeFormat): string {
		let f = '';
		switch (v) {
			default:
			case I.TimeFormat.H12:	 f = 'g:i A'; break;
			case I.TimeFormat.H24:	 f = 'H:i'; break;
		};
		return f;
	};

	/**
	 * Formats a Unix timestamp using a predefined time format.
	 * @param {I.TimeFormat} f - The time format enum value.
	 * @param {number} t - The Unix timestamp.
	 * @returns {string} The formatted time string.
	 */
	timeWithFormat (f: I.TimeFormat, t: number): string {
		return this.date(this.timeFormat(f), t);
	};

	/**
	 * Returns a human-readable string for a given day timestamp (e.g., Today, Tomorrow).
	 * @param {any} t - The Unix timestamp.
	 * @returns {string} The day string.
	 */
	dayString (t: any): string {
		t = Number(t) || 0;

		const ct = this.date('d.m.Y', t);
		const time = this.now();

		let ret = '';
		if (ct == this.date('d.m.Y', time)) {
			ret = translate('commonToday');
		} else
		if (ct == this.date('d.m.Y', time + 86400)) {
			ret = translate('commonTomorrow');
		} else
		if (ct == this.date('d.m.Y', time - 86400)) {
			ret = translate('commonYesterday');
		};
		return ret;
	};

	/**
	 * Returns a human-readable string for how long ago a timestamp was.
	 * @param {number} t - The Unix timestamp.
	 * @returns {string} The time ago string.
	 */
	timeAgo (t: number): string {
		if (!t) {
			return '';
		};

		let delta = this.now() - t;
		const d = Math.floor(delta / 86400);

		delta -= d * 86400;
		const h = Math.floor(delta / 3600);

		delta -= h * 3600;
		const m = Math.floor(delta / 60);

		delta -= m * 60;
		const s = delta;

		let ret = '';
		if (d > 0) {
			ret = U.Common.sprintf('%d days ago', d);
		} else
		if (h > 0) {
			ret = U.Common.sprintf('%d hours ago', h);
		} else
		if (m > 0) {
			ret = U.Common.sprintf('%d minutes ago', m);
		} else
		if (s > 0) {
			ret = U.Common.sprintf('%d seconds ago', s);
		};
		return ret;
	};

	/**
	 * Returns a human-readable duration string for a given number of seconds.
	 * @param {number} t - The duration in seconds.
	 * @returns {string} The duration string.
	 */
	duration (t: number): string {
		if (!t) {
			return '';
		};

		const DAY_IN_SECONDS = 86400;
		const y = Math.floor(t / (DAY_IN_SECONDS * 365));

		t -= y * (DAY_IN_SECONDS * 365);

		const d = Math.floor(t / DAY_IN_SECONDS);

		t -= d * DAY_IN_SECONDS;
		const h = Math.floor(t / 3600);

		t -= h * 3600;
		const m = Math.floor(t / 60);

		t -= m * 60;
		const s = t;

		let ret = '';
		if (y > 0) {
			ret = U.Common.sprintf('%dy', y);
		} else
		if (d > 0) {
			ret = U.Common.sprintf('%dd', d);
		} else
		if (h > 0) {
			ret = U.Common.sprintf('%dh', h);
		} else
		if (m > 0) {
			ret = U.Common.sprintf('%dmin', m);
		} else
		if (s > 0) {
			ret = U.Common.sprintf('%ds', s);
		};
		return ret;
	};

	/**
	 * Merges the time from one timestamp with the date from another.
	 * @param {number} date - The date timestamp.
	 * @param {number} time - The time timestamp.
	 * @returns {number} The merged Unix timestamp.
	 */
	mergeTimeWithDate (date: number, time: number) {
		const y = Number(this.date('Y', date));
		const m = Number(this.date('n', date));
		const d = Number(this.date('d', date));

		const h = Number(this.date('H', time));
		const i = Number(this.date('i', time));
		const s = Number(this.date('s', time));
		
		return this.timestamp(y, m, d, h, i, s);
	};

	/**
	 * Returns the calendar date parameters (day, month, year) for a timestamp.
	 * @param {number} t - The Unix timestamp.
	 * @returns {{ d: number, m: number, y: number }} The date parameters.
	 */
	getCalendarDateParam (t: number) {
		return {
			d: Number(this.date('j', t)),
			m: Number(this.date('n', t)),
			y: Number(this.date('Y', t)),
		};
	};

	/**
	 * Returns the number of days in each month for a given year.
	 * @param {number} y - The year.
	 * @returns {object} The month days mapping.
	 */
	getMonthDays (y: number) {
		const ret = {...J.Constant.monthDays};

		// February
		if (this.isLeapYear(y)) {
			ret[2] = 29;
		};

		return ret;
	};

	/**
	 * Returns an array of day objects for the calendar month view.
	 * @param {number} value - The timestamp for the month.
	 * @param {boolean} [noOther] - Whether to exclude days from other months.
	 * @returns {any[]} The array of day objects.
	 */
	getCalendarMonth (value: number, noOther?: boolean) {
		const { firstDay } = S.Common;
		const { m, y } = this.getCalendarDateParam(value);
		const md = this.getMonthDays(y);
		const today = this.today();
		
		let wdf = Number(this.date('N', this.timestamp(y, m, 1)));
		let wdl = Number(this.date('N', this.timestamp(y, m, md[m])));
		let pm = m - 1;
		let nm = m + 1;
		let py = y;
		let ny = y;

		if (pm < 1) {
			pm = 12;
			py = y - 1;
		};

		if (nm > 12) {
			nm = 1;
			ny = y + 1;
		};

		wdf = (wdf - firstDay + 7) % 7; 
		wdl = (wdl - firstDay + 7) % 7;

		let days = [];

		if (!noOther) {
			for (let i = 1; i <= wdf; ++i) {
				days.push({ d: md[pm] - (wdf - i), m: pm, y: py });
			};
		};

		for (let i = 1; i <= md[m]; ++i) {
			days.push({ y, m, d: i });
		};

		if (!noOther) {
			for (let i = 1; i <= (6 - wdl); ++i) {
				days.push({ d: i, m: nm, y: ny });
			};
		};

		days = days.map(it => {
			const ts = this.timestamp(it.y, it.m, it.d);
			const wd = Number(this.date('N', ts));

			return {
				...it,
				ts,
				wd, 
				isToday: ts == today,
				isWeekend: wd >= 6,
			};
		});

		return days;
	};

	/**
	 * Checks whether a given year is a leap year.
	 * @remarks A given year is considered a leap year, if it's divisible by 4, but not divisible by 100, unless also divisible by 400.
	 * @param {number} year - The year to check.
	 * @returns {boolean} True if the given year is considered a leap year.
	 */
	isLeapYear (year: number): boolean {
		if (year % 4 !== 0) {
			return false;
		};
		if (year % 400 === 0) {
			return true;
		};
		if (year % 100 === 0) {
			return false;
		};
		return true;
	};

	/**
	 * Returns an array of week day objects for the current locale.
	 * @returns {{ id: number, name: string }[]} The week days.
	 */
	getWeekDays (): { id: number, name: string }[] {
		const { firstDay } = S.Common;
		const ret = [];

		for (let i = firstDay; i <= 7; ++i) {
			ret.push({ id: i, name: translate(`day${i}`) });
		};

		for (let i = 1; i < firstDay; ++i) {
			ret.push({ id: i, name: translate(`day${i}`) });
		};

		return ret;
	};

	/**
	 * Returns an array of month objects for the current locale.
	 * @returns {{ id: number, name: string }[]} The months.
	 */
	getMonths (): { id: number, name: string }[] {
		const ret = [];
		for (let i = 1; i <= 12; ++i) {
			ret.push({ id: i, name: translate(`month${i}`) });
		};
		return ret;
	};

	/**
	 * Returns an array of year objects for the given range.
	 * @param {number} start - The start year.
	 * @param {number} end - The end year.
	 * @returns {{ id: number, name: string }[]} The years.
	 */
	getYears (start: number, end: number): { id: number, name: string }[] {
		const ret = [];
		for (let i = start; i <= end; ++i) {
			ret.push({ id: i, name: i });
		};
		return ret;
	};

	/**
	 * Returns the date parameters (day, month, year) for a timestamp.
	 * @param {number} t - The Unix timestamp.
	 * @returns {{ d: number, m: number, y: number }} The date parameters.
	 */
	getDateParam (t: number) {
		const [ d, m, y ] = U.Date.date('j,n,Y', t).split(',').map(it => Number(it));
		return { d, m, y };
	};

};

export default new UtilDate();