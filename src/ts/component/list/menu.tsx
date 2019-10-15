import * as React from 'react';
import { Menu } from 'ts/component';
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
		
		this.close = this.close.bind(this);
	};
	
	render () {
		const { history, commonStore } = this.props;
		const { menus } = commonStore;
		const dimmer = <div className="dimmer" onMouseDown={this.close} />;
		
		return (
			<div className="menus">
				{menus.map((item: I.Menu, i: number) => (
					<Menu history={history} key={item.id} {...item} />
				))}
				{menus.length ? dimmer : ''}
			</div>
		);
	};
	
	close () {
		const { commonStore } = this.props;
		commonStore.menuCloseAll();
	};
	
};

export default ListMenu;