import * as React from 'react';
import { Menu } from 'ts/component';
import { menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I } from 'ts/lib';

interface Props {
	history: any;
}

const ListMenu = observer(class ListMenu extends React.Component<Props, {}> {

	render () {
		const { history } = this.props;
		const { list } = menuStore;
		
		return (
			<div className="menus">
				{list.map((item: I.Menu, i: number) => (
					<Menu history={history} key={item.id} {...item} />
				))}
				<div id="menu-polygon" />
			</div>
		);
	};
	
});

export default ListMenu;