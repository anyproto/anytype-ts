import React, { FC } from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { S } from 'Lib';
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

	const { config } = S.Common;
	const cn = [ 'item' ];
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
	const counters = S.Chat.getSpaceCounters(item.targetSpaceId) || {};
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	let icon = null;
	let cnt = null;

	if (!item.isButton) {
		icon = <IconObject object={item} size={36} iconSize={36} />;
	} else {
		cn.push(`isButton ${item.id}`);
	};

	if (config.experimental) {
		if (counters.mentionCounter) {
			cnt = '@';
		} else 
		if (counters.messageCounter) {
			cnt = counters.messageCounter;
		};
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
				{cnt ? <div className="cnt">{cnt}</div> : ''}
			</div>
		</div>
	);

});

export default VaultItem;