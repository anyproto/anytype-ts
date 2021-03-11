import * as React from 'react';
import { Popup } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I } from 'ts/lib';
import { RouteComponentProps } from 'react-router';

interface Props extends RouteComponentProps<any> {};

const $ = require('jquery');

@observer
class ListPopup extends React.Component<Props, {}> {

	render () {
		const { popups } = commonStore;
		
		return (
			<div className="popups">
				{popups.map((item: I.Popup, i: number) => (
					<Popup {...this.props} key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidUpdate () {
		const { popups } = commonStore;
		const body = $('body');
		
		popups.length > 0 ? body.addClass('over') : body.removeClass('over');
	};
	
};

export default ListPopup;