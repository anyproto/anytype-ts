import { U, translate, keyboard, Storage } from 'Lib';

const getSections = () => {
	const isMac = U.Common.isPlatformMac();
	const cmdKey = keyboard.cmdKey();
	const or = translate('commonOr');
	const storage = Storage.getShortcuts();

	const mapper = (item: any) => {
		if (!item.keys) {
			return item;
		};

		if (item.id && storage[item.id]) {
			item.keys = storage[item.id] || [];
		};

		item.symbols = keyboard.getSymbolsFromKeys(item.keys);
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
						{ id: 'settings', name: translate('popupShortcutNavigationBasics1'), keys: [ cmdKey, 'comma' ] },
						{ id: 'navigation', name: translate('popupShortcutNavigationBasics2'), keys: [ cmdKey, 'o' ] },
						{ id: 'graph', name: translate('popupShortcutNavigationBasics3'), keys: [ cmdKey, 'alt', 'o' ] },
						{ id: 'search', name: translate('popupShortcutNavigationBasics4'), keys: [ cmdKey, 'k' ] },
						{ id: 'home', name: translate('popupShortcutNavigationBasics6'), keys: [ 'alt', 'h' ] },
						{ id: 'back', name: translate('popupShortcutNavigationBasics7'), keys: isMac ? [ cmdKey, '[' ] : [ 'alt', 'arrowleft' ] },
						{ id: 'forward', name: translate('popupShortcutNavigationBasics8'), keys: isMac ? [ cmdKey, ']' ] : [ 'alt', 'arrowright' ] },
						{ id: 'shortcut', name: translate('popupShortcutMainBasics14'), keys: [ 'ctrl', 'space' ] },
						{ id: 'bin', name: translate('popupShortcutNavigationBasics11'), keys: [ cmdKey, 'alt', 'b' ] },
						{ name: translate('popupShortcutMainBasics20'), keys: [ 'ctrl', 'tab' ] },
						{ name: translate('popupShortcutMainBasics23'), keys: [ 'ctrl', 'shift', 'tab' ] },
						{ name: translate('popupShortcutMainBasics12'), keys: [ 'shift', 'click' ] },
						{ name: translate('popupShortcutMainBasics13'), keys: [ cmdKey, 'click' ] },
					]
				},

				{
					name: translate('popupShortcutNavigationMenu'), children: [
						{ name: translate('popupShortcutNavigationMenu1'), keys: [ 'arrowdown' ] },
						{ name: translate('popupShortcutNavigationMenu2'), keys: [ 'arrowup' ] },
						{ name: translate('popupShortcutNavigationMenu3'), keys: [ 'arrowleft' ] },
						{ name: translate('popupShortcutNavigationMenu4'), keys: [ 'arrowright' ] },
						{ name: translate('popupShortcutNavigationMenu5'), keys: [ 'enter' ] },
					]
				},

				{ 
					name: translate('popupShortcutObject'), children: [
						{ id: 'relation', name: translate('popupShortcutNavigationPage9'), keys: [ cmdKey, 'shift', 'r' ] },
						{ id: 'print', name: translate('popupShortcutMainBasics8'), keys: [ cmdKey, 'p' ] },
						{ id: 'history', name: translate('popupShortcutMainBasics11'), keys: [ cmdKey, 'alt', 'h' ] },
						{ id: 'searchText', name: translate('popupShortcutMainBasics9'), keys: [ cmdKey, 'f' ] },
						{ id: 'pageLock', name: translate('popupShortcutMainBasics24'), keys: [ 'ctrl', 'shift', 'l' ] },
					]
				},

				{ 
					name: translate('popupShortcutEditor'), children: [
						{ id: 'menuAdd', name: translate('popupShortcutMainActions1'), keys: [ '/' ] },
						{ id: 'menuAction', name: translate('popupShortcutMainActions2'), keys: [ cmdKey, '/' ] },

						{ name: translate('popupShortcutMainStructuring1'), keys: [ 'enter' ] },
						{ name: translate('popupShortcutMainStructuring2'), keys: [ 'shift', 'enter' ] },
						{ name: translate('popupShortcutMainStructuring3'), keys: [ 'delete' ] },
						{ id: 'indent', name: translate('popupShortcutMainStructuring4'), keys: [ 'tab' ] },
						{ id: 'outdent', name: translate('popupShortcutMainStructuring5'), keys: [ 'shift', 'tab' ] },

						{ name: translate('popupShortcutMainSelection1'), text: translate('popupShortcutMainSelectionDblClick') },
						{ name: translate('popupShortcutMainSelection2'), text: translate('popupShortcutMainSelectionTplClick') },
						{ id: 'selectAll', name: translate('popupShortcutMainSelection3'), keys: [ cmdKey, 'a' ] },
						{ id: 'duplicate', name: translate('popupShortcutMainActions7'), keys: [ cmdKey, 'd' ] },
						{ id: 'menuSmile', name: translate('popupShortcutMainActions8'), keys: [ cmdKey, 'e' ] },
						{ name: translate('popupShortcutMainSelection4'), keys: [ 'shift', 'arrowup' ] },
						{ name: translate('popupShortcutMainSelection7'), keys: [ 'shift', 'arrowdown' ] },
						{ name: translate('popupShortcutMainSelection5'), keys: [ cmdKey, 'click' ] },
						{ name: translate('popupShortcutMainSelection6'), keys: [ 'shift', 'click' ] },

						{ name: translate('popupShortcutNavigationPage1'), keys: [ cmdKey, 'shift', 't' ] },
						{ name: translate('popupShortcutNavigationPage2'), keys: [ 'arrowdown' ] },
						{ name: translate('popupShortcutNavigationPage3'), keys: [ 'arrowup' ] },
						{ name: translate('popupShortcutNavigationPage4'), keys: [ cmdKey, 'arrowleft' ] },
						{ name: translate('popupShortcutNavigationPage5'), keys: [ cmdKey, 'arrowright' ] },
						{ name: translate('popupShortcutNavigationPage6'), keys: [ cmdKey, 'arrowup' ] },
						{ name: translate('popupShortcutNavigationPage7'), keys: [ cmdKey, 'arrowdown' ] },
						{ id: 'moveSelectionUp', name: translate('popupShortcutNavigationPage8'), keys: [ cmdKey, 'shift', 'arrowup' ] },
						{ id: 'moveSelectionDown', name: translate('popupShortcutNavigationPage11'), keys: [ cmdKey, 'shift', 'arrowdown' ] },
						{ name: translate('popupShortcutNavigationPage10'), keys: [ cmdKey, 'enter' ] },

						{ id: 'turnBlock0', name: translate('popupShortcutEditorTurn0'), keys: [ cmdKey, '0' ], noEdit: true },
						{ id: 'turnBlock1', name: translate('popupShortcutEditorTurn1'), keys: [ cmdKey, '1' ], noEdit: true },
						{ id: 'turnBlock2', name: translate('popupShortcutEditorTurn2'), keys: [ cmdKey, '2' ], noEdit: true },
						{ id: 'turnBlock3', name: translate('popupShortcutEditorTurn3'), keys: [ cmdKey, '3' ], noEdit: true },
						{ id: 'turnBlock4', name: translate('popupShortcutEditorTurn4'), keys: [ cmdKey, '4' ], noEdit: true },
						{ id: 'turnBlock5', name: translate('popupShortcutEditorTurn5'), keys: [ cmdKey, '5' ], noEdit: true },
						{ id: 'turnBlock6', name: translate('popupShortcutEditorTurn6'), keys: [ cmdKey, '6' ], noEdit: true },
						{ id: 'turnBlock7', name: translate('popupShortcutEditorTurn7'), keys: [ cmdKey, '7' ], noEdit: true },
						{ id: 'turnBlock8', name: translate('popupShortcutEditorTurn8'), keys: [ cmdKey, '8' ], noEdit: true },
						{ id: 'turnBlock9', name: translate('popupShortcutEditorTurn9'), keys: [ cmdKey, '9' ], noEdit: true },
					]
				},

				/*
				{
					name: translate('popupShortcutChat'), children: [
						{ id: 'chatObject', name: translate('popupShortcutChat1'), keys: [ cmdKey, 't' ] },
						{ id: 'chatMention', name: translate('popupShortcutChat3'), keys: [ cmdKey, 'm' ] },
					]
				},
				*/

				{
					name: translate('popupShortcutMainTextStyle'), children: [
						{ id: 'textBold', name: translate('popupShortcutMainTextStyle1'), keys: [ cmdKey, 'b' ] },
						{ id: 'textItalic', name: translate('popupShortcutMainTextStyle2'), keys: [ cmdKey, 'i' ] },
						{ id: 'textUnderlined', name: translate('popupShortcutMainTextStyle3'), keys: [ cmdKey, 'u' ] },
						{ id: 'textStrike', name: translate('popupShortcutMainTextStyle4'), keys: [ cmdKey, 'shift', 's' ] },
						{ id: 'textLink', name: translate('popupShortcutMainTextStyle5'), keys: [ cmdKey, 'shift', 'k' ] },
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
						{ name: translate('popupShortcutCommandText6'), text: '/callout' },
						{ name: translate('popupShortcutCommandText7'), text: '/code' },
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
						{ name: translate('popupShortcutCommandObjects9'), text: '/audio' },
						{ name: translate('popupShortcutCommandObjects10'), text: '/table' },
						{ name: translate('popupShortcutCommandObjects11'), text: '/inline' },

						/*
						{ name: translate('popupShortcutCommandView0'), text: '/grid' },
						{ name: translate('popupShortcutCommandView1'), text: '/list' },
						{ name: translate('popupShortcutCommandView2'), text: '/gallery' },
						{ name: translate('popupShortcutCommandView3'), text: '/kanban' },
						{ name: translate('popupShortcutCommandView4'), text: '/calendar' },
						{ name: translate('popupShortcutCommandView5'), text: '/graph' },
						*/
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

	let s = 0;

	sections.forEach(section => {
		s++;
		
		let c = 0;

		section.children.forEach(sub => {
			c++;

			let i = 0;

			sub.children.forEach(item => {
				i++;

				const key = item.id || [s, c, i].join('-');
				ret[key] = item;
			});
		});
	});

	return ret;
};

export { getSections, getItems };
