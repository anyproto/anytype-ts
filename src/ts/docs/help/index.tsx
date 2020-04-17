import { I } from 'ts/lib';

const Index = [
	{ type: I.BlockType.IconPage, icon: '❓' },
	{ type: I.BlockType.Title, text: 'Help' },
	{ type: I.BlockType.Link, icon: '⌨️', name: 'Keyboard & Shortcuts', contentId: 'shortcuts' },
	{ type: I.BlockType.Link, icon: '👋', name: 'What\'s new', contentId: 'new' },
];

import Shortcuts from './shortcuts';

export {
	Index,
	Shortcuts,
};