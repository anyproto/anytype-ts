import * as React from 'react';
import { MenuItemVertical, Button, ShareTooltip } from 'Component';
import { I, S, U, J, Onboarding, keyboard, analytics, Action, Highlight, Storage, translate, Preview } from 'Lib';

class MenuHelp extends React.Component<I.Menu> {

	n = -1;

	constructor (props: I.Menu) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const items = this.getItems();

		return (
			<React.Fragment>
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
									onMouseEnter={e => this.onMouseEnter(e, item)}
									onClick={e => this.onClick(e, item)}
								/>
							);
						};

						return content;
					})}
				</div>
				<ShareTooltip />
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.rebind();
		Preview.shareTooltipHide();
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
		const btn = <Button className="c16" text={U.Common.getElectron().version.app} />;

		return [
			{ id: 'whatsNew', document: 'whatsNew', caption: btn },
			{ id: 'shortcut', caption: 'Ctrl+Space' },
			{ isDiv: true },
			{ id: 'gallery' },
			{ id: 'community' },
			{ id: 'tutorial' },
			{ id: 'contact' },
			{ id: 'tech' },
			{ isDiv: true },
			{ id: 'terms' },
			{ id: 'privacy' },
		].map(it => ({ ...it, name: translate(U.Common.toCamelCase(`menuHelp-${it.id}`)) }));
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { getId, close } = this.props;
		const isGraph = keyboard.isMainGraph();
		const home = U.Space.getDashboard();

		close();
		analytics.event(U.Common.toUpperCamelCase([ getId(), item.id ].join('-')), { route: analytics.route.menuHelp });

		Highlight.hide(item.id);

		switch (item.id) {
			case 'whatsNew': {
				S.Popup.open('help', { preventResize: true, data: { document: item.document } });
				break;
			};

			case 'shortcut': {
				S.Popup.open('shortcut', { preventResize: true });
				break;
			};

			case 'gallery':
			case 'terms':
			case 'tutorial':
			case 'privacy':
			case 'community': {
				Action.openUrl(J.Url[item.id]);
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

		};

	};

};

export default MenuHelp;
