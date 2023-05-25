import * as React from 'react';
import * as Docs from 'Docs';
import { MenuItemVertical, Button } from 'Component';
import { I, Util, Onboarding, keyboard, analytics, Renderer, Highlight } from 'Lib';
import { popupStore, detailStore, blockStore } from 'Store';
import Url from 'json/url.json';

class MenuHelp extends React.Component<I.Menu> {

	n = -1;

	constructor (props: I.Menu) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const items = this.getItems();

		return (
			<div className="items">
				{items.map((item: any, i: number) => {
					let content = null;
					
					if (item.isDiv) {
						content = (
							<div key={i} className="separator">
								<div className="inner" />
							</div>
						);
					} else {
						content = (
							<MenuItemVertical
								key={i}
								{...item}
								onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }}
								onClick={(e: any) => { this.onClick(e, item); }}
							/>
						);
					};

					return content;
				})}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		Highlight.showAll();
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const btn = <Button className="c16" text={window.Electron.version.app} />;

		return [
			{ id: 'whatsNew', name: 'What\'s New', document: 'whatsNew', caption: btn },
			{ id: 'shortcut', name: 'Keyboard Shortcuts', caption: 'Ctrl+Space' },
			{ id: 'hints', name: 'Show Hints' },
			{ isDiv: true },
			{ id: 'community', name: 'Anytype Community' },
			{ id: 'tutorial', name: 'Help & Tutorials' },
			{ id: 'contact', name: 'Contact Us' },
			{ id: 'tech', name: 'Technical Information' },
			{ isDiv: true },
			{ id: 'terms', name: 'Terms of Use' },
			{ id: 'privacy', name: 'Privacy Policy' },
		];
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { getId, close } = this.props;
		const isGraph = keyboard.isMainGraph();

		close();
		analytics.event(Util.toUpperCamelCase([ getId(), item.id ].join('-')));

		Highlight.hide(item.id);

		switch (item.id) {
			case 'whatsNew': {
				popupStore.open('help', { data: { document: item.document } });
				break;
			};

			case 'shortcut': {
				popupStore.open('shortcut', {});
				break;
			};

			case 'terms':
			case 'tutorial':
			case 'privacy':
			case 'community': {
				Renderer.send('urlOpen', Url[item.id]);
				break;
			};

			case 'contact': {
				keyboard.onContactUrl();
				break;
			};

			case 'tech': {
				keyboard.onTechInfo();
				break;
			};

			case 'hints': {
				const isPopup = keyboard.isPopup();
				const rootId = keyboard.getRootId();
				const object = detailStore.get(rootId, rootId, []);
				const match = keyboard.getMatch();
				const { page, action } = match.params;
				const isEditor = (page == 'main') && (action == 'edit');
				const isSet =  (page == 'main') && (action == 'set');

				let key = '';

				if (isSet) {
					key = 'mainSet';
				} else
				if (isEditor) {
					key = blockStore.checkBlockTypeExists(rootId) ? 'objectCreationStart' : 'editor';
				} else
				if (isGraph) {
					key = 'mainGraph';
				} else {
					key = Util.toCamelCase([ page, action ].join('-'));

					if (!Docs.Help.Onboarding[key]) {
						popupStore.open('migration', { data: { type: 'onboarding' } });
						return;
					};
				};

				if (key) {
					Onboarding.start(key, keyboard.isPopup(), true);
				};
				break;
			};

		};

	};

};

export default MenuHelp;
