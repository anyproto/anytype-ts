import * as React from 'react';
import { I, DataUtil } from 'ts/lib';

interface Props {
	object: any;
	className?: string;
};

class Description extends React.Component<Props, {}> {

	public static defaultProps = {
		className: 'descr',
	};

	render () {
		const { object, className } = this.props;
		const description = (object.layout != I.ObjectLayout.Note) ? (object.description || object.snippet) : '';

		return (
			<div className={className}>
				{description}
			</div>
		);
	};
	
};

export default Description;