import * as React from 'react';
import { Popup } from 'ts/component';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
};
interface State {};

@inject('commonStore')
@observer
class ListPopup extends React.Component<Props, State> {

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { commonStore } = this.props;
		const { popups } = commonStore;
		
		let dimmer = null;
		if (popups.length) {
			dimmer = <div className="dimmer" onMouseDown={() => { commonStore.popupCloseAll(); }} />;
		};
		
		return (
			<div className="popups">
				{popups.map((item: any, i: number) => (
					<Popup key={item.id} {...item} />
				))}
				{dimmer}
			</div>
		);
	};
	
};

export default ListPopup;