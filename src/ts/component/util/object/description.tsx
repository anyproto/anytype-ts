import * as React from 'react';
import { I } from 'Lib';

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
		const description = (object.layout != I.ObjectLayout.Note) ? (object.description || object.snippet) : '';

		return (
			<div className={className}>
				{description}
			</div>
		);
	};
	
};

export default Description;