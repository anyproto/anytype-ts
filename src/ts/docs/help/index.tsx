import { I } from 'ts/lib';

const { app } = window.require('electron').remote;
const path = app.getPath('userData');

const Index = [
	{ type: I.BlockType.IconPage, icon: '🔮' },
	{ type: I.BlockType.Title, text: 'Help' },
	
	{ type: I.BlockType.Link, icon: '⌨️', name: 'Keyboard & Shortcuts', contentId: 'shortcuts' },
	{ type: I.BlockType.Link, icon: '👋', name: 'What\'s new', contentId: 'new' },

	{ style: I.TextStyle.Header2, text:  'About' },
	{ text: 'You can use Anytype to create documents, tools, and organize it in a way you want.<br>Anytype is <b>free</b> for you without any storage or upload limits.' },
	{ text: 'Your data is self-hosted. It means, that all the information is stored on your computer.' },

	{ style: I.TextStyle.Header3, text:  'Feedback' },
	{ text: 'We ask you to provide feedback in every moment, at least two times per month.<br>Please, write us via email <a href="mailto:hello@anytype.io">hello@anytype.io</a> or through the bottom-right <span id="button-menu-help" class="link"><span class="icon help"></span> question mark</span>.' },
	{ text: 'More features will be added one by one during the upcoming months.' },

	{ style: I.TextStyle.Header3, text:  'Backups' },
	{ text: 'In this version, all the data becomes encrypted and syncs with our servers.' },
	{ text: 'You can restore the latest snapshot at any moment even if your device is offline, but it is an experimental feature.' },
	{ text: `The 100% working way for data backup is to manually copy and save Anytype's data folder, you can find it here <span id="button-path" class="cp bgColor bgColor-grey textColor textColor-red">${path}</span>.` },
	
	{ style: I.TextStyle.Header3, text:  'Help is under construction' },
	{ text: 'We are working on this section and If you can’t find your answer here, please, get in touch.' },
	{},
	{ text: '<i class="note">This is a closed alpha program</i>' },
];

import Shortcuts from './shortcuts';

export {
	Index,
	Shortcuts,
};
