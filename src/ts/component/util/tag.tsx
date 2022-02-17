import * as React from 'react';
import { Icon } from 'ts/component';

interface Props {
	id?: string;
	text?: string;
	className?: string;
	color?: string;
	canEdit?: boolean;
	onRemove?: (e: any, text: string) => void;
};

class Tag extends React.Component<Props, {}> {

	render () {
		let { id, text, color, className, canEdit, onRemove } = this.props;
		let cn = [ 'tagItem', 'tagColor', 'tagColor-' + (color || 'default') ];
		
		if (className) {
			cn.push(className);
		};
		if (canEdit) {
			cn.push('canEdit');
		};
		
		return (
			<span data-id={id} contentEditable={false} className={cn.join(' ')}>
				<span className="inner">{text}</span>
				{canEdit ? <Icon className="remove" onMouseDown={(e: any) => { onRemove(e, text); }} /> : ''}
			</span>
		);
	};
	
};

export default Tag;