import * as React from 'react';
import { I, Preview } from 'Lib';
import { Icon } from 'Component';

interface Props {
	id?: string;
	icon?: string;
	type?: string;
	subType?: string;
	text?: string;
	className?: string;
	color?: string;
	tooltip?: string;
	tooltipX?: I.MenuDirection;
	tooltipY?: I.MenuDirection;
	onClick?(e: any): void;
};

class Button extends React.Component<Props> {

	node: any = null;

	public static defaultProps = {
		subType: 'submit',
		color: 'orange',
		className: '',
		tooltipX: I.MenuDirection.Center,
		tooltipY: I.MenuDirection.Bottom,
    };

	constructor (props: Props) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { id, type, subType, icon, text, className, color, onClick } = this.props;
		const cn = [ 'button', color, className ];

		let content = null;
		
		switch (type) {
		
			default:
				content = (
					<div 
						ref={node => this.node = node}
						id={id} 
						className={cn.join(' ')} 
						onMouseDown={onClick} 
						onMouseEnter={this.onMouseEnter} 
						onMouseLeave={this.onMouseLeave}
					>
						{icon ? <Icon className={icon} /> : ''}
						<div className="txt" dangerouslySetInnerHTML={{ __html: text }} />
					</div>
				);
				break;
				
			case 'input':
				content = (
					<input 
						ref={node => this.node = node}
						id={id} 
						type={subType} 
						value={text} 
						className={cn.join(' ')} 
						onMouseDown={onClick} 
						onMouseEnter={this.onMouseEnter} 
						onMouseLeave={this.onMouseLeave} 
					/>
				);
				break;
		};
		
		return content;
	};

	onMouseEnter (e: any) {
		const { tooltip, tooltipX, tooltipY } = this.props;
		const node = $(this.node);
		
		if (tooltip) {
			Preview.tooltipShow(tooltip, node, tooltipX, tooltipY);
		};
	};
	
	onMouseLeave (e: any) {
		Preview.tooltipHide(false);
	};
	
};

export default Button;