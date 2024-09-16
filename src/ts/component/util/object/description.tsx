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

		let { description } = object;
		if (!description && U.Object.isNoteLayout(object.layout)) {
			description = object.snippet;
		};

		if (!description) {
			return null;
		};

		return (
			<div className={className}>{description}</div>
		);
	};
	
};

export default Description;