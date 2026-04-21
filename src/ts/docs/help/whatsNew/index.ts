import { createHelpers } from './common';
import v055 from './v055';
import v054 from './v054';
import v053 from './v053';
import v052 from './v052';
import v051 from './v051';
import v050 from './v050';

export default () => {
	const h = createHelpers();
	return [
		...v055(h),
		h.div(),
		...v054(h),
		h.div(),
		...v053(h),
		h.div(),
		...v052(h),
		h.div(),
		...v051(h),
		h.div(),
		...v050(h),
	];
};
