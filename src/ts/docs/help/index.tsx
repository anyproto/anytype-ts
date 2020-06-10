import { I } from 'ts/lib';

const Index = [
	{ type: I.BlockType.IconPage, icon: '🔮' },
	{ type: I.BlockType.Title, text: 'Help' },
	{ type: I.BlockType.Link, icon: '⌨️', name: 'Keyboard & Shortcuts', contentId: 'shortcuts' },
	{ type: I.BlockType.Link, icon: '👋', name: 'What\'s new', contentId: 'new' },
	{ type: I.BlockType.Text, style: I.TextStyle.Header2, text:  'About' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'You can use Anytype to create documents, tools, and organize it in a way you want. <br>Anytype is <b>free</b> for you without any storage or upload limits.' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'Your data is self-hosted. It`s mean that all the information is stored on your computer. ' },
	{ type: I.BlockType.Text, style: I.TextStyle.Header3, text:  'Feedback' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'We asking you to provide feedback in every moment, at least 2 times a month. <br>Please, write us via email <a href="mailto:hello@anytype.io">hello@anytype.io</a> or through the bottom-right question <img src="./img/help/question_dark0.svg" style="height:20px;margin-bottom:-4px;"> menu. More features will be added one by one during the upcoming months.' },
	{ type: I.BlockType.Text, style: I.TextStyle.Header3, text:  'Backups' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'In this version, all the data become encrypted and syncing with our servers. You can restore the latest snapshot at any moment even if your device is offline, but it is an experimental feature. The 100% working way for data backup is to manually copy and save Anytype`s data folder. Usually, you can find it here <bgcolor class="bgColor bgColor-grey" data-param="grey"><color class="textColor textColor-red"data-param="red">~/Library/Application Support/anytype2/data</color></bgcolor>.' },
	{ type: I.BlockType.Text, style: I.TextStyle.Header3, text:  'Help is under construction' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: 'We are working on this section and If you can’t find your answer here, please, get in touch.' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: '' },
	{ type: I.BlockType.Text, style: I.TextStyle.Paragraph, text: '<i class="note">This is a closed alpha program</i>' },
];

import Shortcuts from './shortcuts';

export {
	Index,
	Shortcuts,
};
