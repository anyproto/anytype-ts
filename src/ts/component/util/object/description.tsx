import * as React from 'react';
import { U } from 'Lib';

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
		if (U.Object.isNoteLayout(object.layout)) {
			description = '';
		};

		if (!description) {
			return null;
		};

		return <div className={className} dangerouslySetInnerHTML={{ __html: U.Common.sanitize(description) }} />;
	};
	
};

export default Description;