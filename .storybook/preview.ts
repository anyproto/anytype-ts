import type { Preview } from '@storybook/react';

// Load Electron mock before anything else - must precede SCSS/component imports
// so that modules resolved during import (e.g. Storage) find window.Electron
import './mocks/electron';

// Make jQuery available globally — many components use $ without importing it
import $ from 'jquery';
(window as any).$ = $;
(window as any).jQuery = $;

import '../src/scss/common.scss';
import './storybook.scss';
import { withAppClass } from './decorators';

const preview: Preview = {
	decorators: [ withAppClass ],
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
