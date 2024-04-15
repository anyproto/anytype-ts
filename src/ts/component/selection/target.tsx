import * as React from 'react';
import { I, UtilCommon } from 'Lib';

interface Props {
	id: string;
	type: I.SelectType;
	children?: React.ReactNode;
	style?: any;
};

class SelectionTarget extends React.Component<Props> {
	
	public static defaultProps: Props = {
		id: '',
		type: I.SelectType.None,
		style: {},
	};

	render () {
		const { id, type, children, style } = this.props;

		return (
			<div 
				id={`selectionTarget-${id}`} 
				className="selectionTarget"
				style={style}
				{...UtilCommon.dataProps({ id, type })}
			>
				{children}
			</div>
		);
	};
	
};

export default SelectionTarget;