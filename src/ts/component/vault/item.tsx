import React, { FC } from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';

interface Props {
	item: any;
	onClick: (e: any) => void;
	onMouseEnter: (e: any) => void;
	onMouseLeave: () => void;
	onContextMenu: (e: any) => void;
};

const VaultItem: FC<Props> = observer(({ 
	item,
	onClick, 
	onMouseEnter, 
	onMouseLeave, 
	onContextMenu,
}) => {
	const cn = [ 'item' ];

	let icon = null;
	if (!item.isButton) {
		icon = <IconObject object={item} size={36} iconSize={36} />;
	} else {
		cn.push(`isButton ${item.id}`);
	};

	return (
		<div 
			id={`item-${item.id}`}
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