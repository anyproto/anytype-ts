import * as React from 'react';
import { Popup, Dimmer } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I } from 'ts/lib';

interface Props {
	history: any;
	commonStore?: any;
};

const $ = require('jquery');

@observer
class ListPopup extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onClose = this.onClose.bind(this);
	};
	
	render () {
		const { history } = this.props;
		const { popups } = commonStore;
		
		return (
			<div className="popups">
				{popups.map((item: I.Popup, i: number) => (
					<Popup history={history} key={i} {...item} />
				))}
				{popups.length ? <Dimmer onClick={this.onClose} /> : ''}
			</div>
		);
	};
	
	componentDidUpdate () {
		const { popups } = commonStore;
		const body = $('body');
		
		popups.length > 0 ? body.addClass('over') : body.removeClass('over');
	};
	
	onClose () {
		commonStore.popupCloseAll();
	};
	
};

export default ListPopup;