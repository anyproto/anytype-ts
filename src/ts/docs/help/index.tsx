import { I } from 'ts/lib';

const Index = [
	{ type: I.BlockType.Icon, icon: ':question:' },
	{ type: I.BlockType.Title, text: 'Help' },
	{ type: I.BlockType.Link, icon: ':keyboard:', name: 'Keyboard & Shortcuts', contentId: 'shortcuts' },
];

import Shortcuts from './shortcuts';

export {
	Index,
	Shortcuts,
};