import React, { FC } from 'react';
import { Menu } from 'Component';
import { observer } from 'mobx-react';
import { I, S } from 'Lib';

interface Props {
	history: any;
};

const ListMenu: FC<Props> = observer(() => {
	const { list } = S.Menu;

	return (
		<div className="menus">
			{list.map((item: I.Menu) => (
				<Menu key={item.id} {...item} />
			))}
			<div id="menu-polygon" />
		</div>
	);
});

export default ListMenu;