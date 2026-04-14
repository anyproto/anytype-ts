import React, { FC } from 'react';
import { Menu } from 'Component';
import * as I from 'Interface';

const ListMenu: FC = () => {
	const { list } = S.Menu;

	return (
		<div className="menus">
			{list.map((item: I.Menu) => (
				<Menu key={item.id} {...item} />
			))}
			<div id="menu-polygon" />
		</div>
	);
};

export default ListMenu;