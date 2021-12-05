import * as React from 'react';
import { Menu } from 'ts/component';
import { menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I } from 'ts/lib';

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