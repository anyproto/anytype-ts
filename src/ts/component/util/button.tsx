import * as React from 'react';
import { Icon } from 'ts/component';

interface Props {
	id?: string;
	icon?: string;
	type?: string;
	subType?: string;
	text?: string;
	className?: string;
	onClick?(e: any): void;
};

interface EmptyProps {
};

class Button extends React.Component<Props, {}> {

	public static defaultProps = {
		subType: 'submit'
    };

	render () {
		const { id, type, subType, icon, text, className, onClick } = this.props;

		let Component: React.ReactType<EmptyProps>;
		let cn = [ 'button' ];
		
		if (className) {
			cn.push(className);
		};
		
		switch (type) {
		
			default:
				Component = () => { 
					return (
						<div id={id} className={cn.join(' ')} onMouseDown={onClick}>
							{icon ? <Icon className={icon} /> : ''}
							<div className="txt" dangerouslySetInnerHTML={{ __html: text }} />
						</div>
					);
				};
				break;
				
			case 'input':
				Component = () => { 
					return (
						<input id={id} type={subType} className={cn.join(' ')} onMouseDown={onClick} value={text} />
					);
				};
				break;
		};
		
		return <Component />;
	};
	
};

export default Button;