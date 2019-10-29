import * as React from 'react';
import { Menu, Dimmer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { I } from 'ts/lib';

interface Props {
	history: any;
	commonStore?: any;
};

@inject('commonStore')
@observer
class ListMenu extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onClose = this.onClose.bind(this);
	};
	
	render () {
		const { history, commonStore } = this.props;
		const { menus } = commonStore;
		
		return (
			<div className="menus">
				{menus.map((item: I.Menu, i: number) => (
					<Menu history={history} key={i} {...item} />
				))}
				{menus.length ? <Dimmer onClick={this.onClose} /> : ''}
			</div>
		);
	};
	
	onClose () {
		const { commonStore } = this.props;
		commonStore.menuCloseAll();
	};
	
};

export default ListMenu;