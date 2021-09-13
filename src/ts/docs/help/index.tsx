import { I } from 'ts/lib';

const { app } = window.require('electron').remote;
const path = app.getPath('userData');

const Status = [
	{ type: I.BlockType.IconPage, icon: '🔮' },
	{ style: I.TextStyle.Title, text: 'Status' },

	{ style: I.TextStyle.Header2, text:  'About' },
	{ text: 'You can use Anytype to create documents, tools, and organize it in a way you want.<br>Anytype is <b>free</b> for you without any storage or upload limits.' },
	{ text: 'Your data is self-hosted. It means, that all the information is stored on your computer.' },

	{ style: I.TextStyle.Header3, text:  'Feedback' },
	{ text: 'We ask you to provide feedback in every moment, at least two times per month.<br>You can do that via <a href="https://community.anytype.io/">community forum</a> or use the build-in feedback panel via bottom-right <span class="icon help"></span> mark if you want to stay incognito.' },
	{ text: 'More features will be added one by one during the upcoming months.' },

	{ style: I.TextStyle.Header3, text:  'Backups' },
	{ text: `In this version, all the data becomes encrypted and syncs with our servers.
			You can restore the latest snapshot at any moment even if your device is offline, but it is an experimental feature.
			The 100% working way for data backup is to manually copy and save Anytype's data folder, you can find it here <a href="${path}" class="path cp bgColor bgColor-grey textColor textColor-red">${path}</a>.`
	},

	{ style: I.TextStyle.Header3, text:  'Help is under construction' },
	{ text: 'We are working on this section and If you can’t find your answer here, please, get in touch.' },
	{},
	{ text: '<i class="note">This is a closed alpha program</i>' },
];

import WhatsNew from './whatsNew';
import Intro from './intro';

export {
	Status,
	WhatsNew,
	Intro,
};
