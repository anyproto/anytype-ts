import * as React from 'react';
import { I, UtilObject, translate } from 'Lib';

interface Props {
	object: any;
	className?: string;
};

class Name extends React.Component<Props> {

	public static defaultProps = {
		className: 'name',
	};

	render () {
		const { className } = this.props;
		const object = this.props.object || {};
		const { layout, snippet, isDeleted } = object;
	
		let name = String(object.name || '');

		if (!isDeleted) {
			if (layout == I.ObjectLayout.Note) {
				name = snippet || <span className="empty">{translate('commonEmpty')}</span>;
			} else {
				name = UtilObject.name(object);
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