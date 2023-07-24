import * as React from 'react';
import { I, UtilCommon } from 'Lib';

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

class DropTarget extends React.Component<Props> {
	
	constructor (props: Props) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { 
			id, rootId, cacheKey, targetContextId, dropType, type, style, children, className, canDropMiddle, isTargetTop, isTargetBottom, isTargetColumn, 
			isReversed, onContextMenu,
		} = this.props;
		const key = [ dropType, cacheKey || id ];
		const cn = [ 'dropTarget', 'isDroppable', 'root-' + rootId, 'drop-target-' + id ];

		if (className) {
			cn.push(className);
		};
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
				key={'drop-target-' + id}
				className={cn.join(' ')} 
				onClick={this.onClick} 
				onContextMenu={onContextMenu}
				{...UtilCommon.dataProps({
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
	
	onClick (e: any) {
		const { onClick } = this.props;
		
		if (onClick) {
			onClick(e);
		};
	};
	
};

export default DropTarget;