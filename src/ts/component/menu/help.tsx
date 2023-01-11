import * as React from 'react';
import { MenuItemVertical, Button } from 'Component';
import { I, Util, Onboarding, keyboard, analytics, Renderer } from 'Lib';
import { popupStore, blockStore, detailStore } from 'Store';
import Constant from 'json/constant.json';
import Url from 'json/url.json';

class MenuHelp extends React.Component<I.Menu> {

	n: number = 0;

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
		const btn = <Button color="orange" className="c16" text={window.Electron.version.app} />;

		return [
			{ id: 'whatsNew', name: 'What\'s new', document: 'whatsNew', caption: btn, withCaption: true },
			{ id: 'community', name: 'Anytype Community' },
			{ isDiv: true },
			{ id: 'shortcut', name: 'Keyboard Shortcuts', caption: 'Ctrl+Space', withCaption: true },
			{ id: 'hints', name: 'Show hints' },
			{ id: 'tutorial', name: 'Help & Tutorials' },
		];
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { getId, close } = this.props;

		close();
		analytics.event(Util.toUpperCamelCase([ getId(), item.id ].join('-')));

		switch (item.id) {
			case 'whatsNew': {
				popupStore.open('help', { data: { document: item.document } });
				break;
			};

			case 'shortcut': {
				popupStore.open('shortcut', {});
				break;
			};

			case 'feedback': {
				Renderer.send('urlOpen', Url.feedback);
				break;
			};

			case 'community': {
				Renderer.send('urlOpen', Url.community);
				break;
			};

			case 'tutorial': {
				Renderer.send('urlOpen', Url.docs);
				break;
			};

			case 'hints': {
				const isPopup = keyboard.isPopup();
				const rootId = keyboard.getRootId();
				const object = detailStore.get(rootId, rootId, []);
				const match = keyboard.getMatch();
				const { page, action } = match.params;
				const isEditor = (page == 'main') && (action == 'edit');

				let key = '';

				if (object.type == Constant.typeId.set) {
					key = 'set';
				} else 
				if (object.type == Constant.typeId.template) {
					key = 'template';
				} else
				if (isEditor) {
					key = blockStore.checkBlockTypeExists(rootId) ? 'typeSelect' : 'editor';
				} else {
					key = Util.toCamelCase([ page, action ].join('-'));
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
