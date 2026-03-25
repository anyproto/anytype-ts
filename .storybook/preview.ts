import type { Preview } from '@storybook/react';

// Load Electron mock before anything else - must precede SCSS/component imports
// so that modules resolved during import (e.g. Storage) find window.Electron
import './mocks/electron';

import '../src/scss/common.scss';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /date$/i,
			},
		},
	},
};

export default preview;
