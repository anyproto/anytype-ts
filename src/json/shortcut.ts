import { U, translate, keyboard } from 'Lib';

const getSections = () => {
	const isMac = U.Common.isPlatformMac();
	const cmdSymbol = keyboard.cmdSymbol();
	const cmdKey = keyboard.cmdKey();
	const alt = keyboard.altSymbol();
	const shift = keyboard.shiftSymbol();
	const or = translate('commonOr');

	const mapper = (item: any) => {
		if (!item.keys) {
			return item;
		};

		item.symbols = item.keys.map((key: string) => {
			if (key === cmdKey) {
				return cmdSymbol;
			};
			if (key == 'shift') {
				return shift;
			};
			if (key == 'alt') {
				return alt;
			};
			if ((key == 'ctrl') && isMac) {
				return '&#8963;';
			};
			if (key == 'enter') {
				return '&#8629;';
			};
			if (key == 'delete') {
				return 'Del';
			};
			return key;
		});
		return item;
	};

	return [
		{
			id: 'shortcut',
			name: translate('popupShortcutKeyboard'),
			children: [
				{
					name: translate('popupShortcutBasics'), children: [
						{ id: 'createObject', name: translate('popupShortcutMainBasics1'), keys: [ cmdKey, 'n' ] },
						{ id: 'selectType', name: translate('popupShortcutMainBasics19'), keys: [ cmdKey, 'alt', 'n' ] },
						{ id: 'newWindow', name: translate('popupShortcutMainBasics2'), keys: [ cmdKey, 'shift', 'n' ] },
						{ id: 'close', name: translate('popupShortcutMainBasics10'), keys: [ cmdKey, 'q' ] },
						{ id: 'lock', name: translate('popupShortcutMainBasics22'), keys: [ cmdKey, 'alt', 'l' ] },
						{ id: 'undo', name: translate('popupShortcutMainBasics6'), keys: [ cmdKey, 'z' ] },
						{ id: 'redo', name: translate('popupShortcutMainBasics7'), keys: [ cmdKey, 'shift', 'z' ] },
					]
				},

				{
					name: translate('popupShortcutInterface'), children: [
						{ id: 'toggleSidebar', name: translate('popupShortcutMainBasics15'), keys: [ cmdKey, '.' ] },
						{ id: 'toggleFullscreen', name: translate('popupShortcutMainBasics5'), keys: [ cmdKey, 'shift', 'f' ] },
						{ id: 'zoomIn', name: translate('popupShortcutMainBasics16'), keys: [ cmdKey, '=' ] },
						{ id: 'zoomOut', name: translate('popupShortcutMainBasics17'), keys: [ cmdKey, '-' ] },
						{ id: 'zoomReset', name: translate('popupShortcutMainBasics18'), keys: [ cmdKey, '0' ] },
						{ id: 'theme', name: translate('popupShortcutMainBasics21'), keys: [ cmdKey, 'shift', 'm' ] },
					]
				},

				{
					name: translate('popupShortcutNavigation'), children: [
						{ id: 'settings', name: translate('popupShortcutNavigationBasics1'), keys: [ cmdKey, ',' ] },
						{ id: 'navigation', name: translate('popupShortcutNavigationBasics2'), keys: [ cmdKey, 'o' ] },
						{ id: 'graph', name: translate('popupShortcutNavigationBasics3'), keys: [ cmdKey, 'alt', 'o' ] },
						{ id: 'search', name: translate('popupShortcutNavigationBasics4'), keys: [ cmdKey, 's' ] },
						{ id: 'home', name: translate('popupShortcutNavigationBasics6'), keys: [ 'alt', 'h' ] },
						{ id: 'back', name: translate('popupShortcutNavigationBasics7'), keys: isMac ? [ cmdKey, '[' ] : [ 'alt', '←' ] },
						{ id: 'forward', name: translate('popupShortcutNavigationBasics8'), keys: isMac ? [ cmdKey, ']' ] : [ 'alt', '→' ] },
						{ id: 'shortcut', name: translate('popupShortcutMainBasics14'), keys: [ 'ctrl', 'space' ] },
						{ id: 'bin', name: translate('popupShortcutMainBasics14'), keys: [ cmdKey, 'alt', 'b' ] },
						{ name: translate('popupShortcutMainBasics20'), keys: [ 'ctrl', 'tab' ] },
						{ name: translate('popupShortcutMainBasics23'), keys: [ 'ctrl', 'shift', 'tab' ] },
						{ name: translate('popupShortcutMainBasics12'), keys: [ 'shift', 'click' ] },
						{ name: translate('popupShortcutMainBasics13'), keys: [ cmdKey, 'click' ] },
					]
				},

				{
					name: translate('popupShortcutNavigationMenu'), children: [
						{ name: translate('popupShortcutNavigationMenu1'), keys: [ '↓', '[,]', 'tab' ] },
						{ name: translate('popupShortcutNavigationMenu2'), keys: [ '↑', '[,]', 'shift', 'tab' ] },
						{ name: translate('popupShortcutNavigationMenu3'), keys: [ '←' ] },
						{ name: translate('popupShortcutNavigationMenu4'), keys: [ '→' ] },
						{ name: translate('popupShortcutNavigationMenu5'), keys: [ 'enter' ] },
					]
				},

				{ 
					name: translate('popupShortcutObject'), children: [
						{ id: 'relation', name: translate('popupShortcutNavigationPage9'), keys: [ cmdKey, 'shift', 'r' ] },
						{ id: 'print', name: translate('popupShortcutMainBasics8'), keys: [ cmdKey, 'p' ] },
						{ id: 'history', name: translate('popupShortcutMainBasics11'), keys: [ cmdKey, 'alt', 'h' ] },
						{ id: 'searchText', name: translate('popupShortcutMainBasics9'), keys: [ cmdKey, 'f' ] },
					]
				},

				{ 
					name: translate('popupShortcutEditor'), children: [
						{ name: translate('popupShortcutMainStructuring1'), keys: [ 'enter' ] },
						{ name: translate('popupShortcutMainStructuring2'), keys: [ 'shift', 'enter' ] },
						{ name: translate('popupShortcutMainStructuring3'), keys: [ 'delete' ] },
						{ name: translate('popupShortcutMainStructuring4'), keys: [ 'tab' ] },
						{ name: translate('popupShortcutMainStructuring5'), keys: [ 'shift', 'tab' ] },

						{ name: translate('popupShortcutMainSelection1'), text: translate('popupShortcutMainSelectionDblClick') },
						{ name: translate('popupShortcutMainSelection2'), text: translate('popupShortcutMainSelectionTplClick') },
						{ name: translate('popupShortcutMainSelection3'), keys: [ cmdKey, 'a' ] },
						{ name: translate('popupShortcutMainSelection4'), keys: [ 'shift', '↑' ] },
						{ name: translate('popupShortcutMainSelection7'), keys: [ 'shift', '↓' ] },
						{ name: translate('popupShortcutMainSelection5'), keys: [ cmdKey, 'click' ] },
						{ name: translate('popupShortcutMainSelection6'), keys: [ 'shift', 'click' ] },

						{ name: translate('popupShortcutNavigationPage1'), keys: [ cmdKey, 'shift', 't' ] },
						{ name: translate('popupShortcutNavigationPage2'), keys: [ '↓' ] },
						{ name: translate('popupShortcutNavigationPage3'), keys: [ '↑' ] },
						{ name: translate('popupShortcutNavigationPage4'), keys: [ cmdKey, '←' ] },
						{ name: translate('popupShortcutNavigationPage5'), keys: [ cmdKey, '→' ] },
						{ name: translate('popupShortcutNavigationPage6'), keys: [ cmdKey, '↑' ] },
						{ name: translate('popupShortcutNavigationPage7'), keys: [ cmdKey, '↓' ] },
						{ name: translate('popupShortcutNavigationPage8'), keys: [ cmdKey, 'shift', '↑' ] },
						{ name: translate('popupShortcutNavigationPage10'), keys: [ cmdKey, 'shift', '↓' ] },
						{ name: translate('popupShortcutNavigationPage10'), keys: [ cmdKey, 'enter' ] },
					]
				},

				{
					name: translate('popupShortcutMainTextStyle'), children: [
						{ id: 'textBold', name: translate('popupShortcutMainTextStyle1'), keys: [ cmdKey, 'b' ] },
						{ id: 'textItalic', name: translate('popupShortcutMainTextStyle2'), keys: [ cmdKey, 'i' ] },
						{ id: 'textUnderlined', name: translate('popupShortcutMainTextStyle3'), keys: [ cmdKey, 'u' ] },
						{ id: 'textStrike', name: translate('popupShortcutMainTextStyle4'), keys: [ cmdKey, 'shift', 's' ] },
						{ id: 'textLink', name: translate('popupShortcutMainTextStyle5'), keys: [ cmdKey, 'k' ] },
						{ id: 'textCode', name: translate('popupShortcutMainTextStyle6'), keys: [ cmdKey, 'l' ] },
						{ id: 'textColor', name: translate('popupShortcutMainTextStyle7'), keys: [ cmdKey, 'shift', 'c' ] },
						{ id: 'textBackground', name: translate('popupShortcutMainTextStyle8'), keys: [ cmdKey, 'shift', 'h' ] },
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
	].map(s => {
		s.children = s.children.map(sub => {
			sub.children = sub.children.map(mapper);
			return sub;
		});
		return s;
	});
};

const getItems = () => {
	const sections = getSections();
	const ret = {};

	sections.forEach(section => {
		section.children.forEach(sub => {
			sub.children.forEach(item => {
				if (item.id) {
					ret[item.id] = item;
				};
			});
		});
	});

	return ret;
};

	/*
	return [
		{
			id: 'main',
			name: translate('popupShortcutMain'),
			children: [
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

export { getSections, getItems };