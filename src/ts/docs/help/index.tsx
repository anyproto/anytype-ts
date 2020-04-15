import { I } from 'ts/lib';

const Index = [
	{ type: I.BlockType.IconPage, icon: ':question:' },
	{ type: I.BlockType.Title, text: 'Help' },
	{ type: I.BlockType.Link, icon: ':keyboard:', name: 'Keyboard & Shortcuts', contentId: 'shortcuts' },
	{ type: I.BlockType.Link, icon: ':wave:', name: 'What\'s new', contentId: 'new' },
];

import Shortcuts from './shortcuts';

export {
	Index,
	Shortcuts,
};
