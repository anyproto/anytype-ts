import * as React from 'react';
import { Menu } from 'Component';
import { observer } from 'mobx-react';
import { I, S } from 'Lib';

interface Props {
	history: any;
};

const ListMenu = observer(class ListMenu extends React.Component<Props> {

	render () {
		const { list } = S.Menu;

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