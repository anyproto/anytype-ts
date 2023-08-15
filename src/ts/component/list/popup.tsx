import * as React from 'react';
import { observer } from 'mobx-react';
import { Popup } from 'Component';
import { popupStore } from 'Store';
import { I } from 'Lib';

const ListPopup = observer(class ListPopup extends React.Component<I.PageComponent> {

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