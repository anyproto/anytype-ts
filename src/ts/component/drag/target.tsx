import * as React from 'react';
import { I } from 'Lib';

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
	children?: React.ReactNode;
	onClick?(e: any): void;
};

class DropTarget extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { id, rootId, cacheKey, targetContextId, dropType, type, style, children, className, canDropMiddle, isTargetTop, isTargetBottom, isTargetColumn } = this.props;
		const key = [ dropType, cacheKey || id ];
		const cn = [ 'dropTarget', 'isDroppable', 'root-' + rootId ];

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
				data-id={id} 
				data-root-id={rootId} 
				data-cache-key={key.join('-')}
				data-drop-type={dropType} 
				data-type={type} 
				data-style={style} 
				data-target-context-id={targetContextId}
				data-drop-middle={Number(canDropMiddle) || 0}
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