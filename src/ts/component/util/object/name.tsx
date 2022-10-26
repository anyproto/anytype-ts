import * as React from 'react';
import { I, DataUtil, translate } from 'Lib';

interface Props {
	object: any;
	className?: string;
};

class Name extends React.Component<Props, {}> {

	public static defaultProps = {
		className: 'name',
	};

	render () {
		let { object, className } = this.props;
		let { name, layout, snippet, isDeleted } = object;

		if (!isDeleted) {
			if (layout == I.ObjectLayout.Note) {
				name = snippet || <span className="empty">{translate('commonEmpty')}</span>;
			} else {
				name = DataUtil.getObjectName(object);
			};
		};
		
		return (
			<div className={className}>
				<span>{name}</span>
			</div>
		);
	};
	
};

export default Name;