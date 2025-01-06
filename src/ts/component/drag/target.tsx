import React, { FC } from 'react';
import { I, U } from 'Lib';

interface Props {
	id: string;
	rootId: string;
	cacheKey?: string;
	targetContextId?: string;
	style?: number;
	type?: I.BlockType;
	dropType: I.DropType;
	className?: string;
	canDropMiddle?: boolean;
	isTargetTop?: boolean;
	isTargetBottom?: boolean;
	isTargetColumn?: boolean;
	isReversed?: boolean;
	children?: React.ReactNode;
	onClick?(e: any): void;
	onContextMenu?(e: any): void;
};

const DropTarget: FC<Props> = ({
	id = '',
	rootId = '',
	cacheKey = '',
	targetContextId = '',
	dropType = I.DropType.None,
	type,
	style = 0,
	className = '',
	canDropMiddle = false,
	isTargetTop = false,
	isTargetBottom = false,
	isTargetColumn = false,
	isReversed = false,
	children,
	onClick,
	onContextMenu,
}) => {
	
	const key = [ dropType, cacheKey || id ];
	const cn = [ 'dropTarget', 'isDroppable', `root-${rootId}`, `drop-target-${id}`, className ];

	if (isTargetTop) {
		cn.push('targetTop');
		key.push('top');
	};
	if (isTargetBottom) {
		cn.push('targetBot');
		key.push('bot');
	};
	if (isTargetColumn) {
		cn.push('targetCol');
		key.push('col');
	};

	return (
		<div 
			key={`drop-target-${id}`}
			className={cn.join(' ')} 
			onClick={onClick} 
			onContextMenu={onContextMenu}
			{...U.Common.dataProps({
				id,
				type,
				style: Number(style) || 0,
				reversed: isReversed,
				'root-id': rootId,
				'cache-key': key.join('-'),
				'drop-type': dropType,
				'context-id': targetContextId,
				'drop-middle': Number(canDropMiddle) || 0,
			})}
		>
			{children}
		</div>
	);
};

export default DropTarget;