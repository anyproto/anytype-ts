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
		const { layout, snippet } = object;

		let description = '';
		if (layout == I.ObjectLayout.Note) {
			description = '';
		} else {
			description = description || snippet;
		};
		
		return (
			<div className={className}>
				{description}
			</div>
		);
	};
	
};

export default Description;