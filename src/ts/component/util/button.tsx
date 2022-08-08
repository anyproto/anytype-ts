import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { Icon } from 'ts/component';

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

class Button extends React.Component<Props, {}> {

	public static defaultProps = {
		subType: 'submit',
		color: 'orange',
		className: '',
		tooltipX: I.MenuDirection.Center,
		tooltipY: I.MenuDirection.Bottom,
    };

	constructor (props: any) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { id, type, subType, icon, text, className, color, onClick } = this.props;

		let content = null;
		let cn = [ 'button', color, className ];
		
		switch (type) {
		
			default:
				content = (
					<div id={id} className={cn.join(' ')} onMouseDown={onClick} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
						{icon ? <Icon className={icon} /> : ''}
						<div className="txt" dangerouslySetInnerHTML={{ __html: text }} />
					</div>
				);
				break;
				
			case 'input':
				content = (
					<input 
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
		const node = $(ReactDOM.findDOMNode(this));
		
		if (tooltip) {
			Util.tooltipShow(tooltip, node, tooltipX, tooltipY);
		};
	};
	
	onMouseLeave (e: any) {
		Util.tooltipHide(false);
	};
	
};

export default Button;