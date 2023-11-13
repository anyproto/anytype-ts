import * as React from 'react';
import { I, UtilObject, translate } from 'Lib';

interface Props {
	object: any;
	className?: string;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

class Name extends React.Component<Props> {

	public static defaultProps = {
		className: 'name',
	};

	render () {
		const { className, onMouseDown, onMouseEnter, onMouseLeave, onClick } = this.props;
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
			<div 
				className={className} 
				onClick={onClick}
				onMouseDown={onMouseDown}
				onMouseEnter={onMouseEnter} 
				onMouseLeave={onMouseLeave}
			>
				<span>{name}</span>
			</div>
		);
	};
	
};

export default Name;