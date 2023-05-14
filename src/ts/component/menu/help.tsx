import * as React from 'react';
import { MenuItemVertical, Button } from 'Component';
import { I, Util, Onboarding, keyboard, analytics, Renderer, Highlight } from 'Lib';
import { popupStore, blockStore, detailStore } from 'Store';
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
			{ id: 'whatsNew', name: 'What\'s New', document: 'whatsNew', caption: btn },
			{ id: 'community', name: 'Anytype Community' },
			{ isDiv: true },
			{ id: 'hints', name: 'Show Hints' },
			{ id: 'shortcut', name: 'Keyboard Shortcuts', caption: 'Ctrl+Space' },
			{ id: 'tutorial', name: 'Help & Tutorials' }
		];
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { getId, close } = this.props;
		const match = keyboard.getMatch();
		const { page, action } = match.params;
		const isGraph = (page == 'main') && (action == 'graph');

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
				if (isGraph) {
					Onboarding.start('mainGraph', keyboard.isPopup(), true);
				} else {
					popupStore.open('migration', { data: { type: 'onboarding' } });
				};
				break;
			};

		};

	};

};

export default MenuHelp;
