import * as React from 'react';
import { Menu } from 'Component';
import { menuStore } from 'Store';
import { observer } from 'mobx-react';
import { I } from 'Lib';

interface Props {
	dataset?: any;
	history: any;
};

const ListMenu = observer(class ListMenu extends React.Component<Props, {}> {

	render () {
		const { list } = menuStore;
		return (
			<div className="menus">
				{list.map((item: I.Menu, i: number) => (
					<Menu {...this.props} key={item.id} {...item} />
				))}
				<div id="menu-polygon" />
			</div>
		);
	};
	
});

export default ListMenu;