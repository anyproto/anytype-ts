import { U, translate, keyboard } from 'Lib';

export default () => {
	const cmdSymbol = keyboard.cmdSymbol();
	const cmdKey = keyboard.cmdKey();
	const alt = keyboard.altSymbol();
	const shift = keyboard.shiftSymbol();
	const or = translate('commonOr');

	const mapper = (item: any) => {
		if (item.keys) {
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
				return key;
			});
		};
		return item;
	};

	return [
		{
			id: 'shortcut',
			name: translate('popupShortcutKeyboard'),
			children: [
				{
					name: translate('popupShortcutBasics'), children: [
						{ id: 'createNewObject', name: translate('popupShortcutMainBasics1'), keys: [ cmdKey, 'n' ] },
						{ id: 'selectType', name: translate('popupShortcutMainBasics19'), keys: [ cmdKey, alt, 'n' ] },
						{ id: 'newWindow', name: translate('popupShortcutMainBasics2'), keys: [ cmdKey, 'shift', 'n' ] },
						{ id: 'close', name: translate('popupShortcutMainBasics10'), keys: [ cmdKey, 'q' ] },
						{ id: 'lock', name: translate('popupShortcutMainBasics22'), keys: [ cmdKey, 'alt', 'l' ] },
						{ id: 'undo', name: translate('popupShortcutMainBasics6'), keys: [ cmdKey, 'z' ] },
						{ id: 'redo', name: translate('popupShortcutMainBasics7'), keys: [ cmdKey, shift, 'z' ] },
					]
				},

				{
					name: translate('popupShortcutInterface'), children: [
						{ id: 'toggleSidebar', name: translate('popupShortcutMainBasics15'), keys: [ cmdKey, '.' ] },
						{ id: 'toggleFullscreen', name: translate('popupShortcutMainBasics5'), keys: [ cmdKey, 'shift', 'f' ] },
						{ id: 'zoomIn', name: translate('popupShortcutMainBasics16'), keys: [ cmdKey, '=' ] },
						{ id: 'zoomOut', name: translate('popupShortcutMainBasics17'), keys: [ cmdKey, '-' ] },
						{ id: 'zoomReset', name: translate('popupShortcutMainBasics18'), keys: [ cmdKey, '0' ] },
					]
				}
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

	/*
Create New Object
⌘ N
Create New Object and Choose Type
⌘ ⌥ N
New Anytype Window
⌘ ⇧ N
Close Anytype
⌘ Q
Lock Anytype ❗️ 
Unassigned
Log out ❗️ 
Unassigned
Undo
⌘ Z
Redo
⌘ ⇧ Z
#### Interface
Show / Hide Sidebar
⌘ .
Fullscreen
⌘ ⇧ F
Zoom in
⌘ =
Zoom out
⌘ –
Default zoom
⌘ 0
#### Navigation
Jump to a space ⭕️  
⌘ 1-9
Open Settings
⌘ ,
Open the Flow pane
⌘ O
Open the Graph pane
⌘ ⇧ O
Open the Search pane
⌘ S
Open the Library pane
⌘ L
Return to home screen
⌥ H
Go back
⌘ ←
Go forward
⌘ →
Open Bin ❗️ 
Unassigned
Space settings ❗️ 
Unassigned
View shortcuts
⌃ Space
Open in a modal window
⇧ Click
Open in a new window
⌘ Click
#### Menu, Search
Go to the next option ⭕️  
↓ , Tab
Go to the previous option ⭕️  
↑ , ⇧ Tab
Go to the left side of navigation (Link from page) ⭕️  
←
Go to the right side of navigation (Link to page) ⭕️  
→
Select option
Enter
#### Object Actions
Open Relations
⌘ ⇧ R
Print
⌘ P
Version History
⌘ Q
Add to favorites ❗️ 
Unassigned
Add to collection ❗️ 
Unassigned
Link to object ❗️ 
Unassigned
Move object to bin ❗️ 
Unassigned
Copy link ❗️ 
Unassigned
Create widget ❗️ 
Unassigned
Change type ❗️ 
Unassigned
Open in full page ❗️ 
Unassigned
#### Editor
New text block ⭕️  
Enter
Line break ⭕️  
⇧ Enter
Merge block with the one above ⭕️  
Delete
Indent ⭕️  
Tab
Outdent ⭕️  
⇧ Tab
Select word ⭕️  
Double Click
Select an Entire Block ⭕️  
Triple Click
Select all blocks
⌘ A
Expand Selection Up ⭕️  
⇧ ↑
Expand Selection Down ⭕️  
⇧ ↓
Select / Deselect an entire block ⭕️
⌘ Click
Select block and all blocks in between ⭕️
⇧ Click
Expand / Collapse Toggle 
⌘ ⇧ T
Go down one line ⭕️
↓
Go up one line ⭕️
↑
Go to the start of the line  ⭕️
⌘ ←
Go to the end of the line  ⭕️
⌘ →
Go to the top of the Object  ⭕️
⌘ ↑
Go to the end of the Object  ⭕️
⌘ ↓
Move selected block(s) up  ⭕️
⌘ ⇧ ↑
Move selected block(s) down  ⭕️
⌘ ⇧ ↓
Check / Uncheck Checkbox
⌘ Enter
actual 
#### Set and Collection
Focus the first object in list ❗️ 
Enter
Select objects above ❗️  ⭕️
⇧ ↑
Select objects below ❗️   ⭕️
⇧ ↓
Switch views ❗️ 
Unassigned
Create New Object in set  ❗️ 
⌘ N
Create New Object From Template ❗️ 
Unassigned
#### Text Style
Bold
⌘ B
Italic
⌘ I
Underline
⌘ U
Strikethrough
⌘ ⇧ S
Add a link
⌘ K
Convert to inline code
⌘ L
Apply previously selected font color
⌘ ⇧ C
Apply previously selected highlight
⌘ ⇧ H
	*/

	/*
	return [
		{
			id: 'main',
			name: translate('popupShortcutMain'),
			children: [
				{
					name: translate('popupShortcutBasics'), children: [
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