import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Popup } from 'Component';
import { I, S } from 'Lib';

const ListPopup = observer(class ListPopup extends React.Component<I.PageComponent> {

	render () {
		const { list } = S.Popup;

		return (
			<div className="popups">
				{list.map((item: I.Popup, i: number) => (
					<Popup {...this.props} key={i} {...item} />
				))}
			</div>
		);
	};

	componentDidUpdate () {
		$('body').toggleClass('overPopup', S.Popup.list.length > 0);
	};
	
});

export default ListPopup;