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

	node = null;
	
	render () {
		const { id, type, children, style } = this.props;
		const cn = [ 'selectionTarget', `type-${type}` ];

		return (
			<div 
				id={`selectionTarget-${id}`}
				ref={ref => this.node = ref}
				className={cn.join(' ')}
				style={style}
				{...UtilCommon.dataProps({ id, type })}
			>
				{children}
			</div>
		);
	};

	componentDidMount(): void {
		this.registerRef(true);
	};

	componentWillUnmount(): void {
		this.registerRef(false);
	};

	registerRef (v: boolean) {
		const { id, type, dataset } = this.props;
		const { selection } = dataset || {};

		if (selection) {
			selection.registerRef(id, type, v ? $(this.node) : null);
		};
	};

};

export default SelectionTarget;