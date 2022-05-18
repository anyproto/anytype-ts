import * as React from 'react';
import { I } from 'ts/lib';

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
	onClick?(e: any): void;
};

class DropTarget extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { id, rootId, cacheKey, targetContextId, dropType, type, style, children, className, canDropMiddle } = this.props;
		
		let cn = [ 'dropTarget', 'root-' + rootId ];
		if (className) {
			cn.push(className);
		};

		return (
			<div 
				key={'drop-target-' + id}
				className={cn.join(' ')} 
				onClick={this.onClick} 
				data-id={id} 
				data-root-id={rootId} 
				data-cache-key={cacheKey}
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