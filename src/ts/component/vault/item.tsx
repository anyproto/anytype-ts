import React, { FC } from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { U } from 'Lib';

interface Props {
	id: string;
	isButton: boolean;
	onClick: (e: any) => void;
	onMouseEnter: (e: any) => void;
	onMouseLeave: () => void;
	onContextMenu: (e: any) => void;
};

const VaultItem: FC<Props> = observer(({ 
	id = '', 
	isButton = false, 
	onClick, 
	onMouseEnter, 
	onMouseLeave, 
	onContextMenu,
}) => {
	const cn = [ 'item' ];

	let icon = null;
	if (!isButton) {
		const object = U.Menu.getVaultItems().find(it => it.id == id);
		icon = <IconObject object={object} size={36} iconSize={36} />;
	} else {
		cn.push(`isButton ${id}`);
	};

	return (
		<div 
			id={`item-${id}`}
			className={cn.join(' ')}
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onContextMenu={onContextMenu}
		>
			<div className="iconWrap">
				{icon}
			</div>
		</div>
	);
});

export default VaultItem;