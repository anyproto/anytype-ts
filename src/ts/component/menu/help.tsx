import * as React from 'react';
import { MenuItemVertical, Button } from 'Component';
import { I, UtilCommon, Onboarding, keyboard, analytics, Renderer, Highlight, Storage, UtilObject, translate } from 'Lib';
import { popupStore, blockStore } from 'Store';
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
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const btn = <Button className="c16" text={window.Electron.version.app} />;

		return [
			{ id: 'whatsNew', document: 'whatsNew', caption: btn },
			{ id: 'shortcut', caption: 'Ctrl+Space' },
			{ id: 'hints' },
			{ isDiv: true },
			{ id: 'community' },
			{ id: 'tutorial' },
			{ id: 'contact' },
			{ id: 'tech' },
			{ isDiv: true },
			{ id: 'terms' },
			{ id: 'privacy' },
		].map(it => ({ ...it, name: translate(UtilCommon.toCamelCase(`menuHelp-${it.id}`)) }));
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { getId, close } = this.props;
		const rootId = keyboard.getRootId();
		const isPopup = keyboard.isPopup();
		const isEditor = keyboard.isMainEditor();
		const isGraph = keyboard.isMainGraph();
		const isSet = keyboard.isMainSet();
		const isStore = keyboard.isMainStore();
		const storeTab = Storage.get('tabStore');
		const isStoreType = isStore && (storeTab == I.StoreTab.Type);
		const isStoreRelation = isStore && (storeTab == I.StoreTab.Relation);
		const home = UtilObject.getSpaceDashboard();

		close();
		analytics.event(UtilCommon.toUpperCamelCase([ getId(), item.id ].join('-')));

		Highlight.hide(item.id);

		switch (item.id) {
			case 'whatsNew': {
				popupStore.open('help', { preventResize: true, data: { document: item.document } });
				break;
			};

			case 'shortcut': {
				popupStore.open('shortcut', { preventResize: true });
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
				const isEditor = keyboard.isMainEditor();
				const isSet = keyboard.isMainSet();

				let key = '';

				if (isEditor && home && (rootId == home.id)) {
					key = 'dashboard';
				} else 
				if (isSet) {
					key = 'mainSet';
				} else
				if (isEditor) {
					key = blockStore.checkBlockTypeExists(rootId) ? 'objectCreationStart' : 'editor';
				} else
				if (isGraph) {
					key = 'mainGraph';
				} else
				if (isStoreType) {
					key = 'storeType';
				} else
				if (isStoreRelation) {
					key = 'storeRelation';
				} else {
					const { page, action } = keyboard.getMatch().params;

					key = UtilCommon.toCamelCase([ page, action ].join('-'));
				};

				if (key) {
					Onboarding.start(key, isPopup, true);
				};
				break;
			};

		};

	};

};

export default MenuHelp;
