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
	children?: React.ReactNode;
	dataset?: any;
	canDropMiddle?: boolean;
	isPopup?: boolean;
	isReversed?: boolean;
	isTargetTop?: boolean;
	isTargetBottom?: boolean;
	isTargetColumn?: boolean;
	isEmptyToggle?: boolean;
	onClick?(e: any): void;
	onContextMenu?(e: any): void;
};

class DropTarget extends React.Component<Props> {
	
	public static defaultProps: Props = {
		id: '',
		rootId: '',
		targetContextId: '',
		dropType: I.DropType.None,
		isReversed: false,
		isPopup: false,
		canDropMiddle: false,
		isTargetTop: false,
		isTargetBottom: false,
		isTargetColumn: false,
		isEmptyToggle: false,
	};
	
	render () {
		const { 
			id, rootId, targetContextId, dropType, type, style, children, canDropMiddle, isReversed, onClick, onContextMenu, dataset, isPopup, 
			isTargetTop, isTargetBottom, isTargetColumn, isEmptyToggle,
		} = this.props;
		const { dragProvider } = dataset || {};
		const cacheKey = this.getKey();
		const registerProps = {
			id,
			rootId,
			cacheKey,
			type: String(type || ''),
			style: Number(style) || 0,
			targetContextId,
			dropType,
			isPopup,
			canDropMiddle,
			isReversed,
			isTargetTop, 
			isTargetBottom, 
			isTargetColumn, 
			isEmptyToggle,
		};

		return (
			<div 
				ref={ref => dragProvider?.registerRef(registerProps, ref)}
				key={`drop-target-${id}`}
				className={this.getClassName()} 
				onClick={onClick} 
				onContextMenu={onContextMenu}
			>
				{children}
			</div>
		);
	};
	
	getKey (): string {
		const { id, cacheKey, dropType, isTargetTop, isTargetBottom, isTargetColumn } = this.props;
		const key = [ dropType, cacheKey || id ];

		if (isTargetTop) {
			key.push('top');
		};
		if (isTargetBottom) {
			key.push('bot');
		};
		if (isTargetColumn) {
			key.push('col');
		};

		return key.join('-');
	};

	getClassName (): string {
		const { rootId, className, isTargetTop, isTargetBottom, isTargetColumn, isEmptyToggle } = this.props;
		const cn = [ 'dropTarget', 'isDroppable', `root-${rootId}` ];

		if (className) {
			cn.push(className);
		};
		if (isTargetTop) {
			cn.push('targetTop');
		};
		if (isTargetBottom) {
			cn.push('targetBot');
		};
		if (isTargetColumn) {
			cn.push('targetCol');
		};
		if (isEmptyToggle) {
			cn.push('isEmptyToggle');
		};

		return cn.join(' ');
	};
	
};

export default DropTarget;