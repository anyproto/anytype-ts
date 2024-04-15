import * as React from 'react';
import { I, UtilCommon } from 'Lib';

interface Props {
	id: string;
	type: I.SelectType;
	children?: React.ReactNode;
	dataset?: any;
	style?: any;
};

class SelectionTarget extends React.Component<Props> {

	private static defaultProps = {
		id: '',
		type: I.SelectType.None,
		style: {},
	};
	
	render () {
		const { id, type, children, dataset, style } = this.props;
		const { selection } = dataset || {};
		const cn = [ 'selectionTarget', `type-${type}` ];

		return (
			<div 
				id={`selectionTarget-${id}`}
				ref={ref => selection?.registerRef(id, type, ref)}
				className={cn.join(' ')}
				style={style}
				{...UtilCommon.dataProps({ id, type })}
			>
				{children}
			</div>
		);
	};
	
};

export default SelectionTarget;