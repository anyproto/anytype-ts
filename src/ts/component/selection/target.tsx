import * as React from 'react';
import { I, UtilCommon } from 'Lib';

interface Props {
	id: string;
	type: I.SelectType;
	children?: React.ReactNode;
	style?: any;
	className?: string;
	onContextMenu?(e: any): void;
};

class SelectionTarget extends React.Component<Props> {
	
	public static defaultProps: Props = {
		id: '',
		type: I.SelectType.None,
		style: {},
		className: '',
	};

	render () {
		const { id, type, children, style, className, onContextMenu } = this.props;

		return (
			<div 
				id={`selectionTarget-${id}`} 
				className={`selectionTarget ${className}`}
				style={style}
				onContextMenu={onContextMenu}
				{...UtilCommon.dataProps({ id, type })}
			>
				{children}
			</div>
		);
	};
	
};

export default SelectionTarget;