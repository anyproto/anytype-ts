import React, { FC } from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	let icon = null;
	if (!item.isButton) {
		icon = <IconObject object={item} size={36} iconSize={36} />;
	} else {
		cn.push(`isButton ${item.id}`);
	};

	return (
		<div 
			id={`item-${item.id}`}
			ref={setNodeRef}
			className={cn.join(' ')}
			onClick={onClick}
			{...attributes}
			{...listeners}
			style={style}
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