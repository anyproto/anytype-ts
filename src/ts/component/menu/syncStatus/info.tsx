import * as React from 'react';
import { MenuItemVertical, Button, Title, Label } from 'Component';
import { I, UtilCommon, Onboarding, keyboard, analytics, Renderer, Highlight, Storage, UtilSpace, translate } from 'Lib';
import { popupStore, blockStore } from 'Store';
const Url = require('json/url.json');

class MenuSyncStatusInfo extends React.Component<I.Menu> {

	n = -1;

	constructor (props: I.Menu) {
		super(props);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { id } = data;
		const items = this.getItems();

		return (
			<React.Fragment>
				<div className="data">
					<Title text={translate(UtilCommon.toCamelCase([ 'menuSyncStatusInfoTitle', id ].join('-')))} />
					<Label text={'End-to-end encrypted'} />
				</div>

				{items.length ? (
					<div className="items">

					</div>
				) : ''}
			</React.Fragment>
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
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		return [];
	};

};

export default MenuSyncStatusInfo;
