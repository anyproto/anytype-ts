import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { I, UtilCommon, keyboard, translate } from 'Lib';

interface State {
	page: string;
};

class PopupShortcut extends React.Component<I.Popup, State> {

	state = {
		page: 'main',
	};
	_isMounted = false;

	render () {
		const { page } = this.state;
		const isMac = UtilCommon.isPlatformMac();
		const tabs = [
			{ id: 'main', name: translate('popupShortcutMain') },
			{ id: 'navigation', name: translate('popupShortcutNavigation') },
			{ id: 'markdown', name: translate('popupShortcutMarkdown') },
			{ id: 'command', name: translate('popupShortcutCommands') },
		];
		const sections = this.getSections(page);

		const Tab = (item: any) => (
			<div className={[ 'item', (item.id == page ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onPage(item.id); }}>
				{item.name}
			</div>
		);

		const Section = (item: any) => {
			const cn = [ 'section' ];
			if (item.className) {
				cn.push(item.className);
			};

			return (
				<div className={cn.join(' ')}>
					{item.name ? <div className="name">{item.name}</div> : ''}
					{item.description ? <div className="descr">{item.description}</div> : ''}
					<div className="items">
						{item.children.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</div>
				</div>
			);
		};

		const Item = (item: any) => {
			return (
				<div className="item">
					<div className="key" dangerouslySetInnerHTML={{ __html: isMac && item.mac ? item.mac : item.com }} />
					<div className="descr">{item.name}</div>
				</div>
			);
		};

		return (
			<div className="wrapper">
				<div className="head">
					<div className="tabs">
						{tabs.map((item: any, i: number) => (
							<Tab key={i} {...item} />
						))}
					</div>
				</div>

				<div className="body scrollable">
					{sections.map((item: any, i: number) => (
						<Section key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('resize.popupShortcut', () => this.resize());
	};

	unbind () {
		$(window).off('resize.popupShortcut');
	};

	onPage (id: string) {
		this.setState({ page: id });
	};

	getSections (id: string) {
		const cmd = keyboard.cmdSymbol();
		const alt = keyboard.altSymbol();

		const sections = {

			main: [
				{
					name: translate('popupShortcutBasics'), children: [
						{ com: `${cmd} + N`,			 name: translate('popupShortcutMainBasics1') },
						{ com: `${cmd} + Shift + N`,	 name: translate('popupShortcutMainBasics2') },
						{ com: `${cmd} + ${alt} + N`,	 name: translate('popupShortcutMainBasics3') },
						{ com: `${cmd} + Enter`,		 name: translate('popupShortcutMainBasics4') },
						{ com: `${cmd} + ${alt} + F`,	 name: translate('popupShortcutMainBasics5') },
						{ com: `${cmd} + Z`,			 name: translate('popupShortcutMainBasics6') },
						{ com: `${cmd} + Shift + Z`,	 name: translate('popupShortcutMainBasics7') },
						{ com: `${cmd} + P`,			 name: translate('popupShortcutMainBasics8') },
						{ com: `${cmd} + F`,			 name: translate('popupShortcutMainBasics9') },
						{ com: `${cmd} + Q`,			 name: translate('popupShortcutMainBasics10') },
						{ mac: `${cmd} + Y`,			 com: 'Ctrl + H',			 name: translate('popupShortcutMainBasics11') },
						{ com: 'Shift + Click',			 name: translate('popupShortcutMainBasics12') },
						{ com: `${cmd} + Click`,		 name: translate('popupShortcutMainBasics13') },
						{ com: 'Ctrl + Space',		 	 name: translate('popupShortcutMainBasics14') },
						{ com: `${cmd} + \\, ${cmd} + .`, name: translate('popupShortcutMainBasics15') },
						{ com: `${cmd} + =`,			 name: translate('popupShortcutMainBasics16') },
						{ com: `${cmd} + Minus`,		 name: translate('popupShortcutMainBasics17') },
						{ com: `${cmd} + 0`,			 name: translate('popupShortcutMainBasics18') },
					]
				},

				{
					name: translate('popupShortcutMainStructuring'), children: [
						{ com: 'Enter',				 name: translate('popupShortcutMainStructuring1') },
						{ com: 'Shift + Enter',		 name: translate('popupShortcutMainStructuring2') },
						{ com: 'Delete',			 name: translate('popupShortcutMainStructuring3') },
						{ com: 'Tab',				 name: translate('popupShortcutMainStructuring4') },
						{ com: 'Shift + Tab',		 name: translate('popupShortcutMainStructuring5') },
					]
				},

				{
					name: translate('popupShortcutMainSelection'), children: [
						{ com: 'Double Click',			 name: translate('popupShortcutMainSelection1') },
						{ com: 'Triple Click',			 name: translate('popupShortcutMainSelection2') },
						{ com: `${cmd} + A`,			 name: translate('popupShortcutMainSelection3') },
						{ com: 'Shift + ↑ or ↓',		 name: translate('popupShortcutMainSelection4') },
						{ com: `${cmd} + Click`,		 name: translate('popupShortcutMainSelection5') },
						{ com: 'Shift + Click',			 name: translate('popupShortcutMainSelection6') },
					]
				},

				{
					name: translate('popupShortcutMainActions'), children: [
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
						{ com: `${cmd} + Shift +S`,		 name: translate('popupShortcutMainTextStyle4') },
						{ com: `${cmd} + K`,			 name: translate('popupShortcutMainTextStyle5') },
						{ com: `${cmd} + L`,			 name: translate('popupShortcutMainTextStyle6') },
						{ com: `${cmd} + Shift + C`,	 name: translate('popupShortcutMainTextStyle7') },
						{ com: `${cmd} + Shift + H`,	 name: translate('popupShortcutMainTextStyle8') },
					]
				},
			],

			navigation: [
				{
					name: translate('popupShortcutBasics'), children: [
						{ com: `${cmd} + ,(comma)`,		 name: translate('popupShortcutNavigationBasics1') },
						{ com: `${cmd} + O`,			 name: translate('popupShortcutNavigationBasics2') },
						{ com: `${cmd} + ${alt} + O`,	 name: translate('popupShortcutNavigationBasics3') },
						{ com: `${cmd} + S, ${cmd} + K`, name: translate('popupShortcutNavigationBasics4') },
						{ com: `${cmd} + L`,			 name: translate('popupShortcutNavigationBasics5') },
						{ com: `${alt} + H`,			 name: translate('popupShortcutNavigationBasics6') },
						{ mac: `${cmd} + [, ${cmd} + ←`, com: 'Alt + ←',			 name: translate('popupShortcutNavigationBasics7') },
						{ mac: `${cmd} + ], ${cmd} + →`, com: 'Alt + →',			 name: translate('popupShortcutNavigationBasics8') },
					]
				},

				{
					name: translate('popupShortcutNavigationMenu'), children: [
						{ com: '↓ or Tab',			 name: translate('popupShortcutNavigationMenu1') },
						{ com: '↑ or Shift + Tab',	 name: translate('popupShortcutNavigationMenu2') },
						{ com: '←',					 name: translate('popupShortcutNavigationMenu3') },
						{ com: '→',					 name: translate('popupShortcutNavigationMenu4') },
						{ com: 'Enter',				 name: translate('popupShortcutNavigationMenu5') },
					]
				},

				{
					name: translate('popupShortcutNavigationPage'), children: [
						{ com: `${cmd} + Shift + T`, name: translate('popupShortcutNavigationPage1') },
						{ com: '↓',				 name: translate('popupShortcutNavigationPage2') },
						{ com: '↑',				 name: translate('popupShortcutNavigationPage3') },
						{ com: `${cmd} + ←`,	 name: translate('popupShortcutNavigationPage4') },
						{ com: `${cmd} + →`,	 name: translate('popupShortcutNavigationPage5') },
						{ com: `${cmd} + ↑`,	 name: translate('popupShortcutNavigationPage6') },
						{ com: `${cmd} + ↓`,	 name: translate('popupShortcutNavigationPage7') },
						{ com: `${cmd} + Shift + ↑↓`, name: translate('popupShortcutNavigationPage8') },
					]
				},
			],

			markdown: [
				{
					name: translate('popupShortcutMarkdownWhileTyping'),
					children: [
						{ com: '`',					 name: translate('popupShortcutMarkdownWhileTyping1') },
						{ com: '** or __',			 name: translate('popupShortcutMarkdownWhileTyping2') },
						{ com: '* or _',			 name: translate('popupShortcutMarkdownWhileTyping3') },
						{ com: '~~',				 name: translate('popupShortcutMarkdownWhileTyping4') },
						{ com: '-->',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '⟶') },
						{ com: '<--',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '⟵') },
						{ com: '<-->',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '⟷') },
						{ com: '->',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '→') },
						{ com: '<-',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '←') },
						{ com: '--',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '—') },
						{ com: '—>',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '⟶') },
						{ com: '<—',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '⟵') },
						{ com: '(c)',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '©') },
						{ com: '(r)',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '®') },
						{ com: '(tm)',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '™') },
						{ com: '...',				 name: UtilCommon.sprintf(translate('popupShortcutMarkdownWhileTypingInserts'), '…') },
					]
				},
				{
					name: translate('popupShortcutMarkdownBeginningOfLine'),
					children: [
						{ com: '# + Space',			 name: translate('popupShortcutMarkdownBeginningOfLine1') },
						{ com: '# # + Space',		 name: translate('popupShortcutMarkdownBeginningOfLine2') },
						{ com: '# # # + Space',		 name: translate('popupShortcutMarkdownBeginningOfLine3') },
						{ com: '" + Space',			 name: translate('popupShortcutMarkdownBeginningOfLine4') },
						{ com: '* or + or - and Space',	 name: translate('popupShortcutMarkdownBeginningOfLine5') },
						{ com: '[] + Space',		 name: translate('popupShortcutMarkdownBeginningOfLine6') },
						{ com: '1. + Space',		 name: translate('popupShortcutMarkdownBeginningOfLine7') },
						{ com: '>  + Space',		 name: translate('popupShortcutMarkdownBeginningOfLine8') },
						{ com: '```',				 name: translate('popupShortcutMarkdownBeginningOfLine9') },
						{ com: '---',				 name: translate('popupShortcutMarkdownBeginningOfLine10') },
						{ com: '***',				 name: translate('popupShortcutMarkdownBeginningOfLine11') },
					]
				},
			],

			command: [
				{
					name: translate('popupShortcutCommandMenu'), children: [
						{ com: '/',					 name: translate('popupShortcutCommandMenu1') },
						{ com: '↓ & ↑',				 name: translate('popupShortcutCommandMenu2') },
						{ com: '→ & ←',				 name: translate('popupShortcutCommandMenu3') },
						{ com: 'Esc or Clear /',	 name: translate('popupShortcutCommandMenu4') },
					]
				},

				{ description: translate('popupShortcutCommandDescription'), children: [], className: 'separator' },
				{
					name: translate('popupShortcutCommandText'), children: [
						{ com: '/text',			 name: translate('popupShortcutCommandText1') },
						{ com: '/h1',			 name: translate('popupShortcutCommandText2') },
						{ com: '/h2',			 name: translate('popupShortcutCommandText3') },
						{ com: '/h3',			 name: translate('popupShortcutCommandText4') },
						{ com: '/high',			 name: translate('popupShortcutCommandText5') },
					]
				},

				{
					name: translate('popupShortcutCommandLists'), children: [
						{ com: '/todo',			 name: translate('popupShortcutCommandLists1') },
						{ com: '/bullet',		 name: translate('popupShortcutCommandLists2') },
						{ com: '/num',			 name: translate('popupShortcutCommandLists3') },
						{ com: '/toggle',		 name: translate('popupShortcutCommandLists4') },
					]
				},

				{
					name: translate('popupShortcutCommandObjects'), children: [
						{ com: '@today, @tomorrow',	name: translate('popupShortcutCommandObjects1') },
						{ com: '/page',			 	name: translate('popupShortcutCommandObjects2') },
						{ com: '/file',			 	name: translate('popupShortcutCommandObjects3') },
						{ com: '/image',		 	name: translate('popupShortcutCommandObjects4') },
						{ com: '/video',		 	name: translate('popupShortcutCommandObjects5') },
						{ com: '/bookmark',		 	name: translate('popupShortcutCommandObjects6') },
						{ com: '/link',			 	name: translate('popupShortcutCommandObjects7') },
					]
				},

				{
					name: translate('popupShortcutCommandOther'), children: [
						{ com: '/line',			 name: translate('popupShortcutCommandOther1') },
						{ com: '/dots',			 name: translate('popupShortcutCommandOther2') },
						{ com: '/code',			 name: translate('popupShortcutCommandOther3') },
					]
				},
			]

		};

		return sections[id] || [];
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId, position } = this.props;
		const obj = $(`#${getId()}-innerWrap`);
		const loader = obj.find('#loader');
		const hh = UtilCommon.sizeHeader();

		loader.css({ width: obj.width(), height: obj.height() });
		position();

		raf(() => { obj.css({ top: hh + 20, marginTop: 0 }); });
	};

};

export default PopupShortcut;
