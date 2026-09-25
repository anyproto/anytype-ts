import { createHelpers } from './common';
import v057 from './v057';
import v056 from './v056';
import v055 from './v055';
import v054 from './v054';
import v053 from './v053';
import v052 from './v052';
import v051 from './v051';
import v050 from './v050';

const releases = [ v057, v056, v055, v054, v053, v052, v051, v050 ];

export default () => {
	const h = createHelpers();
	return releases.flatMap((r, i) => (i === 0 ? r(h) : [ h.div(), ...r(h) ]));
};
