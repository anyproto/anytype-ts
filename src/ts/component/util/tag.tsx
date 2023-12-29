import * as React from 'react';
import $ from 'jquery';

interface Props {
	id?: string;
	text?: string;
	className?: string;
	color?: string;
	canEdit?: boolean;
	onRemove?: (e: any) => void;
	onContextMenu?(e: any): void;
};

class Tag extends React.Component<Props> {

	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		const { id, text, color, className, canEdit, onContextMenu } = this.props;
		const cn = [ 'tagItem', 'tagColor', 'tagColor-' + (color || 'default') ];
		
		if (className) {
			cn.push(className);
		};
		if (canEdit) {
			cn.push('canEdit');
		};

		let icon = null;
		if (canEdit) {
			icon = (
				<div className="tagRemove" onMouseDown={this.onRemove}>
					<img id="remove" />
				</div>
			);
		};
		
		return (
			<span 
				id={id}
				ref={node => this.node = node}
				contentEditable={false} 
				className={cn.join(' ')}
				onContextMenu={onContextMenu}
			>
				<span className="inner">{text}</span>
				{icon}
			</span>
		);
	};

	componentDidMount () {
		this.setColor();
	};

	componentDidUpdate () {
		this.setColor();
	};

	setColor () {
		const { canEdit } = this.props;
		if (!canEdit) {
			return;
		};

		const node = $(this.node);
		const remove = node.find('#remove');
		const color = node.css('color');

		remove.attr({ src: this.removeSvg(color) });
	};

	removeSvg (color: any) {
		const svg = `
			<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M2.44194 1.55806C2.19786 1.31398 1.80214 1.31398 1.55806 1.55806C1.31398 1.80214 1.31398 2.19786 1.55806 2.44194L4.11612 5L1.55806 7.55806C1.31398 7.80214 1.31398 8.19786 1.55806 8.44194C1.80214 8.68602 2.19786 8.68602 2.44194 8.44194L5 5.88388L7.55806 8.44194C7.80214 8.68602 8.19786 8.68602 8.44194 8.44194C8.68602 8.19786 8.68602 7.80214 8.44194 7.55806L5.88388 5L8.44194 2.44194C8.68602 2.19786 8.68602 1.80214 8.44194 1.55806C8.19786 1.31398 7.80214 1.31398 7.55806 1.55806L5 4.11612L2.44194 1.55806Z" fill="${color}"/>
			</svg>
		`;
		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	onRemove (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { canEdit, onRemove } = this.props;
		if (canEdit && onRemove) {
			onRemove(e);
		};
	};
	
};

export default Tag;