import * as React from 'react';
import { Popup } from 'Component';
import { popupStore } from 'Store';
import { observer } from 'mobx-react';
import { I } from 'Lib';
import { RouteComponentProps } from 'react-router';

interface Props extends RouteComponentProps<any> {}

const $ = require('jquery');

const ListPopup = observer(class ListPopup extends React.Component<Props, {}> {

	render () {
		const { list } = popupStore;

		return (
			<div className="popups">
				{list.map((item: I.Popup, i: number) => (
					<Popup {...this.props} key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidUpdate () {
		const { list } = popupStore;
		const body = $('body');
		
		list.length > 0 ? body.addClass('overPopup') : body.removeClass('overPopup');
	};
	
});

export default ListPopup;