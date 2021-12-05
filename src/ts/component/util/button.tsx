import * as React from 'react';
import { Icon } from 'ts/component';

interface Props {
	id?: string;
	icon?: string;
	type?: string;
	subType?: string;
	text?: string;
	className?: string;
	color?: string;
	onClick?(e: any): void;
};

class Button extends React.Component<Props, {}> {

	public static defaultProps = {
		subType: 'submit',
		color: 'orange',
		className: '',
    };

	render () {
		const { id, type, subType, icon, text, className, color, onClick } = this.props;

		let content = null;
		let cn = [ 'button', color, className ];
		
		switch (type) {
		
			default:
				content = (
					<div id={id} className={cn.join(' ')} onMouseDown={onClick}>
						{icon ? <Icon className={icon} /> : ''}
						<div className="txt" dangerouslySetInnerHTML={{ __html: text }} />
					</div>
				);
				break;
				
			case 'input':
				content = <input id={id} type={subType} className={cn.join(' ')} onMouseDown={onClick} value={text} />
				break;
		};
		
		return content;
	};
	
};

export default Button;