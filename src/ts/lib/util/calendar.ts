import { UtilCommon } from 'Lib';
import Constant from 'json/constant.json';

class UtilCalendar {

	getData (value: number) {
		const m = Number(UtilCommon.date('n', value));
		const y = Number(UtilCommon.date('Y', value));
		const md = Constant.monthDays;
		
		// February
		if (y % 4 === 0) {
			md[2] = 29;
		};
		
		const wdf = Number(UtilCommon.date('N', UtilCommon.timestamp(y, m, 1)));
		const wdl = Number(UtilCommon.date('N', UtilCommon.timestamp(y, m, md[m])));
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

		const days = [];
		for (let i = 1; i <= wdf; ++i) {
			days.push({ d: md[pm] - (wdf - i), m: pm, y: py });
		};
		for (let i = 1; i <= md[m]; ++i) {
			days.push({ y: y, m: m, d: i });
		};

		for (let i = 1; i < 7 - wdl; ++i) {
			days.push({ d: i, m: nm, y: ny });
		};

		return days;
	};

};

export default new UtilCalendar();