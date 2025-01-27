import { U, translate, keyboard } from 'Lib';

export default () => {
	const cmdSymbol = keyboard.cmdSymbol();
	const cmdKey = keyboard.cmdKey();
	const alt = keyboard.altSymbol();
	const shift = keyboard.shiftSymbol();
	const or = translate('commonOr');

	return [
		{
			id: 'shortcut',
			name: 'Keyboard Shortcuts',
			children: [
				{
					name: 'Basics', children: [
						{ id: 'createNewObject', name: 'Create New Object', keys: [ cmdKey, 'n' ], symbols: [ cmdSymbol, 'N' ] },
						{ id: 'selectType', name: 'Select Type and Create Object', keys: [ cmdKey, alt, 'n' ], symbols: [ cmdSymbol, alt, 'N' ] },
					]
				},	
			]
		},

		{
			id: 'markdown',
			name: translate('popupShortcutMarkdown'),
			children: [
				{
					name: translate('popupShortcutMarkdownWhileTyping'),
					children: [
						{ name: translate('popupShortcutMarkdownWhileTyping1'), text: '` `' },
						{ name: translate('popupShortcutMarkdownWhileTyping2'), text: `_ _ ${or} * *` },
						{ name: translate('popupShortcutMarkdownWhileTyping3'), text: `_ ${or} *` },
						{ name: translate('popupShortcutMarkdownWhileTyping4'), text: '~ ~' },

						{ name: U.Common.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '⟶'), text: '-->' },
						{ name: U.Common.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '⟵'), text: '<--' },
						{ name: U.Common.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '⟷'), text: '<-->' },
						{ name: U.Common.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '→'), text: '->' },
						{ name: U.Common.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '←'), text: '<-' },
						{ name: U.Common.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '—'), text: '--' },
						{ name: U.Common.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '®'), text: '(r)' },
						{ name: U.Common.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '™'), text: '(tm)' },
						{ name: U.Common.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '…'), text: '...' },
					]
				},
				{
					name: translate('popupShortcutMarkdownBeginningOfLine'),
					children: [
						{ name: translate('popupShortcutMarkdownBeginningOfLine1'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '#') },
						{ name: translate('popupShortcutMarkdownBeginningOfLine2'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '##') },
						{ name: translate('popupShortcutMarkdownBeginningOfLine3'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '###') },
						{ name: translate('popupShortcutMarkdownBeginningOfLine4'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '"') },
						{ name: translate('popupShortcutMarkdownBeginningOfLine5'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), `* ${or} + ${or} -`) },
						{ name: translate('popupShortcutMarkdownBeginningOfLine6'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '[]') },
						{ name: translate('popupShortcutMarkdownBeginningOfLine7'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '1.') },
						{ name: translate('popupShortcutMarkdownBeginningOfLine8'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '>') },
						{ name: translate('popupShortcutMarkdownBeginningOfLine9'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '```') },
						{ name: translate('popupShortcutMarkdownBeginningOfLine10'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '---') },
						{ name: translate('popupShortcutMarkdownBeginningOfLine11'), text: U.Common.sprintf(translate('popupShortcutMarkdownBeginningOfLineKey'), '***') },
					]
				},
			]
		},

		{
			id: 'command',
			name: translate('popupShortcutCommand'),
			children: [
				{
					name: translate('popupShortcutCommandText'), children: [
						{ name: translate('popupShortcutCommandText1'), text: '/text' },
						{ name: translate('popupShortcutCommandText2'), text: '/h1' },
						{ name: translate('popupShortcutCommandText3'), text: '/h2' },
						{ name: translate('popupShortcutCommandText4'), text: '/h3' },
						{ name: translate('popupShortcutCommandText5'), text: '/high' },
					]
				},

				{
					name: translate('popupShortcutCommandLists'), children: [
						{ name: translate('popupShortcutCommandLists1'), text: '/todo' },
						{ name: translate('popupShortcutCommandLists2'), text: '/bullet' },
						{ name: translate('popupShortcutCommandLists3'), text: '/num' },
						{ name: translate('popupShortcutCommandLists4'), text: '/toggle' },
					]
				},

				{
					name: translate('popupShortcutCommandObjects'), children: [
						{ name: translate('popupShortcutCommandObjects1'), text: '@today, @tomorrow' },
						{ name: translate('popupShortcutCommandObjects8'), text: '@three days ago, @last month, @2016-05-12' },
						{ name: translate('popupShortcutCommandObjects2'), text: '/page' },
						{ name: translate('popupShortcutCommandObjects3'), text: '/file' },
						{ name: translate('popupShortcutCommandObjects4'), text: '/image' },
						{ name: translate('popupShortcutCommandObjects5'), text: '/video' },
						{ name: translate('popupShortcutCommandObjects6'), text: '/bookmark' },
						{ name: translate('popupShortcutCommandObjects7'), text: '/link' },
					]
				},

				{
					name: translate('popupShortcutCommandOther'), children: [
						{ name: translate('popupShortcutCommandOther1'), text: '/line' },
						{ name: translate('popupShortcutCommandOther2'), text: '/dots' },
						{ name: translate('popupShortcutCommandOther3'), text: '/code' },
					]
				},
			]
		},
	];

	/*
	return [
		{
			id: 'main',
			name: translate('popupShortcutMain'),
			children: [
				{
					name: translate('popupShortcutBasics'), children: [
						{ com: `${cmd} + N`,			 name: translate('popupShortcutMainBasics1') },
						{ com: `${cmd} + ${alt} + N`,	 name: translate('popupShortcutMainBasics19') },
						{ com: `${cmd} + ${shift} + N`,	 name: translate('popupShortcutMainBasics2') },
						{ com: `${cmd} + Enter`,		 name: translate('popupShortcutMainBasics4') },
						{ mac: `${cmd} + Ctrl + F`,		 com: `${cmd} + ${alt} + F`,	 name: translate('popupShortcutMainBasics5') },
						{ com: `${cmd} + Z`,			 name: translate('popupShortcutMainBasics6') },
						{ com: `${cmd} + ${shift} + Z`,	 name: translate('popupShortcutMainBasics7') },
						{ com: `${cmd} + P`,			 name: translate('popupShortcutMainBasics8') },
						{ com: `${cmd} + F`,			 name: translate('popupShortcutMainBasics9') },
						{ com: `${cmd} + Q`,			 name: translate('popupShortcutMainBasics10') },
						{ mac: `${cmd} + Y`,			 com: 'Ctrl + H',			 name: translate('popupShortcutMainBasics11') },
						{ com: '${shift} + Click',			 name: translate('popupShortcutMainBasics12') },
						{ com: `${cmd} + Click`,		 name: translate('popupShortcutMainBasics13') },
						{ com: 'Ctrl + Space',		 	 name: translate('popupShortcutMainBasics14') },
						{ com: `${cmd} + \\, ${cmd} + .`, name: translate('popupShortcutMainBasics15') },
						{ com: `${cmd} + =`,			 name: translate('popupShortcutMainBasics16') },
						{ com: `${cmd} + Minus`,		 name: translate('popupShortcutMainBasics17') },
						{ com: `${cmd} + 0`,			 name: translate('popupShortcutMainBasics18') },
						{ com: `Ctrl + Tab, Ctrl + ${shift} + Tab`, name: translate('popupShortcutMainBasics20') },
						{ com: `${cmd} + ${shift} + M`, name: translate('popupShortcutMainBasics21') },
						{ com: `${cmd} + ${alt} + L`, name: translate('popupShortcutMainBasics22') },
					]
				},

				{
					name: translate('popupShortcutMainStructuring'), children: [
						{ com: 'Enter',				 name: translate('popupShortcutMainStructuring1') },
						{ com: `${shift} + Enter`,	 name: translate('popupShortcutMainStructuring2') },
						{ com: 'Delete',			 name: translate('popupShortcutMainStructuring3') },
						{ com: 'Tab',				 name: translate('popupShortcutMainStructuring4') },
						{ com: `${shift} + Tab`,	 name: translate('popupShortcutMainStructuring5') },
					]
				},

				{
					name: translate('popupShortcutMainSelection'), children: [
						{ com: 'Double Click',			 name: translate('popupShortcutMainSelection1') },
						{ com: 'Triple Click',			 name: translate('popupShortcutMainSelection2') },
						{ com: `${cmd} + A`,			 name: translate('popupShortcutMainSelection3') },
						{ com: `${shift} + ↑ or ↓`,		 name: translate('popupShortcutMainSelection4') },
						{ com: `${cmd} + Click`,		 name: translate('popupShortcutMainSelection5') },
						{ com: `${shift} + Click`,		 name: translate('popupShortcutMainSelection6') },
					]
				},

				{
					name: translate('commonActions'), children: [
						{ com: '/',						 name: translate('popupShortcutMainActions1') },
						{ com: `${cmd} + /`,			 name: translate('popupShortcutMainActions2') },
						{ mac: `${cmd} + Delete`,		 com: 'Ctrl + Backspace',	 name: translate('popupShortcutMainActions3') },
						{ com: `${cmd} + C`,			 name: translate('popupShortcutMainActions4') },
						{ com: `${cmd} + X`,			 name: translate('popupShortcutMainActions5') },
						{ com: `${cmd} + V`,			 name: translate('popupShortcutMainActions6') },
						{ com: `${cmd} + D`,			 name: translate('popupShortcutMainActions7') },
						{ com: `${cmd} + E`,			 name: translate('popupShortcutMainActions8') + ' 🏄‍♂' },
					]
				},

				{
					name: translate('popupShortcutMainTextStyle'), children: [
						{ com: `${cmd} + B`,			 name: translate('popupShortcutMainTextStyle1') },
						{ com: `${cmd} + I`,			 name: translate('popupShortcutMainTextStyle2') },
						{ com: `${cmd} + U`,			 name: translate('popupShortcutMainTextStyle3') },
						{ com: `${cmd} + ${shift} +S`,		 name: translate('popupShortcutMainTextStyle4') },
						{ com: `${cmd} + K`,			 name: translate('popupShortcutMainTextStyle5') },
						{ com: `${cmd} + L`,			 name: translate('popupShortcutMainTextStyle6') },
						{ com: `${cmd} + ${shift} + C`,	 name: translate('popupShortcutMainTextStyle7') },
						{ com: `${cmd} + ${shift} + H`,	 name: translate('popupShortcutMainTextStyle8') },
					]
				},
			],
		},

		{
			id: 'navigation',
			name: translate('popupShortcutNavigation'),
			children: [
				{
					name: translate('popupShortcutBasics'), children: [
						{ com: `${cmd} + ,(comma)`,		 name: translate('popupShortcutNavigationBasics1') },
						{ com: `${cmd} + O`,			 name: translate('popupShortcutNavigationBasics2') },
						{ com: `${cmd} + ${alt} + O`,	 name: translate('popupShortcutNavigationBasics3') },
						{ com: `${cmd} + S, ${cmd} + K`, name: translate('popupShortcutNavigationBasics4') },
						{ com: `${alt} + H`,			 name: translate('popupShortcutNavigationBasics6') },
						{ mac: `${cmd} + [, ${cmd} + ←`, com: 'Alt + ←',			 name: translate('popupShortcutNavigationBasics7') },
						{ mac: `${cmd} + ], ${cmd} + →`, com: 'Alt + →',			 name: translate('popupShortcutNavigationBasics8') },
					]
				},

				{
					name: translate('popupShortcutNavigationMenu'), children: [
						{ com: '↓ or Tab',			 name: translate('popupShortcutNavigationMenu1') },
						{ com: '↑ or ${shift} + Tab',	 name: translate('popupShortcutNavigationMenu2') },
						{ com: '←',					 name: translate('popupShortcutNavigationMenu3') },
						{ com: '→',					 name: translate('popupShortcutNavigationMenu4') },
						{ com: 'Enter',				 name: translate('popupShortcutNavigationMenu5') },
					]
				},

				{
					name: translate('popupShortcutNavigationPage'), children: [
						{ com: `${cmd} + ${shift} + T`, name: translate('popupShortcutNavigationPage1') },
						{ com: '↓',				 name: translate('popupShortcutNavigationPage2') },
						{ com: '↑',				 name: translate('popupShortcutNavigationPage3') },
						{ com: `${cmd} + ←`,	 name: translate('popupShortcutNavigationPage4') },
						{ com: `${cmd} + →`,	 name: translate('popupShortcutNavigationPage5') },
						{ com: `${cmd} + ↑`,	 name: translate('popupShortcutNavigationPage6') },
						{ com: `${cmd} + ↓`,	 name: translate('popupShortcutNavigationPage7') },
						{ com: `${cmd} + ${shift} + ↑↓`, name: translate('popupShortcutNavigationPage8') },
						{ com: `${cmd} + ${shift} + R`, name: translate('popupShortcutNavigationPage9') },
						{ com: `${cmd} + Enter`, name: translate('popupShortcutNavigationPage10') },
					]
				},
			],
		},

		{
			id: 'command',
			name: translate('popupShortcutCommand'),
			children: [
				{
					name: translate('commonMenu'), children: [
						{ com: '/',					 name: translate('popupShortcutCommandMenu1') },
						{ com: '↓ & ↑',				 name: translate('popupShortcutCommandMenu2') },
						{ com: '→ & ←',				 name: translate('popupShortcutCommandMenu3') },
						{ com: 'Esc or Clear /',	 name: translate('popupShortcutCommandMenu4') },
					]
				},

				{ description: translate('popupShortcutCommandDescription'), children: [], className: 'separator' },
			],
		},
	];
	*/
};