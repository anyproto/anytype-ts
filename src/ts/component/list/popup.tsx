import * as React from 'react';
import { Popup } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { PopupInterface } from 'ts/store/common';

interface Props {
	commonStore?: any;
};
interface State {};

@inject('commonStore')
@observer
class ListPopup extends React.Component<Props, State> {

	constructor (props: any) {
		super(props);
		
		this.close = this.close.bind(this);
	};
	
	render () {
		const { commonStore } = this.props;
		const { popups } = commonStore;
		const dimmer = <div className="dimmer" onMouseDown={this.close} />;
		
		return (
			<div className="popups">
				{popups.map((item: PopupInterface, i: number) => (
					<Popup key={item.id} {...item} />
				))}
				{popups.length ? dimmer : ''}
			</div>
		);
	};
	
	close () {
		const { commonStore } = this.props;
		commonStore.popupCloseAll();
	};
	
};

export default ListPopup;