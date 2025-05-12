import React, { FC } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon } from 'Component';
import { J, S } from 'Lib';
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
	const theme = S.Common.getThemeClass();

	let icon = null;
	let cnt = null;
	let disabled = false;

	if (!item.isButton) {
		icon = <IconObject object={item} size={36} iconSize={36} param={{ userIcon: J.Theme[theme].textInversion }} />;
	} else {
		cn.push(`isButton ${item.id}`);
	};

	if (!item.isButton) {
		const counters = S.Chat.getSpaceCounters(item.targetSpaceId);

		if (counters.mentionCounter) {
			cnt = <Icon className="mention" />;
		} else 
		if (counters.messageCounter) {
			cnt = counters.messageCounter;
		};
	};

	if (cnt) {
		disabled = true;
	};

	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
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