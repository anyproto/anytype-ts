import { I } from 'ts/lib';

const Index = [
	{ type: I.BlockType.IconPage, icon: '🔮' },
	{ type: I.BlockType.Title, text: 'Help' },
	{ type: I.BlockType.Link, icon: '⌨️', name: 'Keyboard & Shortcuts', contentId: 'shortcuts' },
	{ type: I.BlockType.Link, icon: '👋', name: 'What\'s new', contentId: 'new' },
	{ type: I.BlockType.Text, style: I.TextStyle.Header3, text:  'About' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'You can use Anytype to create documents, tools and organize it in a way you want.' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'Your data is self-hosted. It`s mean that all the information is stored on your computer. Anytype is free without any storage or upload limits.' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'In this version, all the data become encrypted and syncing with our servers. You can restore the latest snapshot at any moment.' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'We asking you to provide feedback in every moment, at least 2 times a month. You can write us a feedback via email <a href="mailto:hello@anytype.io">hello@anytype.io</a> or through (?) bottom-right menu. More features will be added one by one during the coming months.' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'We are working on this section and If you can’t find your answer here, please, get in touch.' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: '' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: '<i class="note">This is a closed alpha program.</i>' },
];

import Shortcuts from './shortcuts';

export {
	Index,
	Shortcuts,
};
