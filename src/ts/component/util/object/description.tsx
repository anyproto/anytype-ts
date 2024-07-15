import * as React from 'react';
import { I, U } from 'Lib';

interface Props {
	object: any;
	className?: string;
};

class Description extends React.Component<Props> {

	public static defaultProps = {
		className: 'descr',
	};

	render () {
		const { className } = this.props;
		const object = this.props.object || {};
		const description = U.Object.isNoteLayout(object.layout) ? (object.description || object.snippet) : '';

		return (
			<div className={className}>
				{description}
			</div>
		);
	};
	
};

export default Description;