import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, Util, Onboarding, keyboard, analytics } from 'ts/lib';
import { popupStore, blockStore, detailStore } from 'ts/store';

interface Props extends I.Menu {};

const Url = require('json/url.json');
const Constant = require('json/constant.json');

class MenuHelp extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const items: any[] = [
			{ id: 'feedback', name: 'Send Feedback' },
			{ id: 'tutorial', name: 'Help & Tutorials' },
			{ id: 'whatsNew', name: 'What\'s new', document: 'whatsNew' },
			{ id: 'community', name: 'Join our Community' },
			{ id: 'shortcut', name: 'Keyboard Shortcuts' },
			{ id: 'hints', name: 'Show hints' },
		];

		return (
			<div className="items">
				{items.map((item: I.MenuItem, i: number) => (
					<MenuItemVertical key={i} {...item} onClick={(e: any) => { this.onClick(e, item); }} />
				))}
			</div>
		);
	};

	onClick (e: any, item: any) {
		const { getId, close } = this.props;
		const renderer = Util.getRenderer();

		close();
		analytics.event(Util.toUpperCamelCase([ getId(), item.id ].join('-')));

		switch (item.id) {
			case 'whatsNew':
				popupStore.open('help', { data: { document: item.document } });
				break;

			case 'shortcut':
				popupStore.open('shortcut', {});
				break;

			case 'feedback':
				renderer.send('urlOpen', Url.feedback);
				break;

			case 'community':
				renderer.send('urlOpen', Url.community);
				break;

			case 'tutorial':
				renderer.send('urlOpen', Url.docs);
				break;

			case 'hints':
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

export default MenuHelp;
