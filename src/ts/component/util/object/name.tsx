import * as React from 'react';
import { I, ObjectUtil, translate } from 'Lib';

interface Props {
	object: any;
	className?: string;
};

class Name extends React.Component<Props> {

	public static defaultProps = {
		className: 'name',
	};

	render () {
		const { object, className } = this.props;
		const { layout, snippet, isDeleted } = object;
	
		let name = String(object.name || '');

		if (!isDeleted) {
			if (layout == I.ObjectLayout.Note) {
				name = snippet || <span className="empty">{translate('commonEmpty')}</span>;
			} else {
				name = ObjectUtil.name(object);
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