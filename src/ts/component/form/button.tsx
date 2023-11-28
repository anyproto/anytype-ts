import * as React from 'react';
import $ from 'jquery';
import { I, UtilCommon, Preview } from 'Lib';
import { Icon, Loader } from 'Component';

interface State {
	isLoading: boolean;
};

class Button extends React.Component<I.ButtonComponent, State> {

	node: any = null;
	state: State = {
		isLoading: false,
	};

	public static defaultProps = {
		subType: 'submit',
		color: 'black',
		className: '',
		tooltipY: I.MenuDirection.Bottom,
    };

	constructor (props: I.ButtonComponent) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { id, type, subType, icon, arrow, text, className, color, onMouseDown, onClick, dataset } = this.props;
		const cn = [ 'button', color, className ];
		const { isLoading } = this.state;

		if (isLoading) {
			cn.push('isLoading');
		};

		let content = null;
		
		switch (type) {
		
			default:
				content = (
					<div 
						ref={node => this.node = node}
						id={id} 
						className={cn.join(' ')} 
						onClick={onClick}
						onMouseDown={onMouseDown} 
						onMouseEnter={this.onMouseEnter} 
						onMouseLeave={this.onMouseLeave}
						{...UtilCommon.dataProps(dataset)}
					>
						{isLoading ? <Loader /> : ''}
						{icon ? <Icon className={icon} /> : ''}
						<div className="txt" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(text) }} />
						{arrow ? <div className="arrow" /> : ''}
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
						{...UtilCommon.dataProps(dataset)}
					/>
				);
				break;
		};
		
		return content;
	};

	onMouseEnter (e: any) {
		const { tooltip, tooltipX, tooltipY, onMouseEnter } = this.props;
		const node = $(this.node);
		
		if (tooltip) {
			Preview.tooltipShow({ text: tooltip, element: node, typeX: tooltipX, typeY: tooltipY });
		};

		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	onMouseLeave (e: any) {
		Preview.tooltipHide(false);
	};

	setLoading (v: boolean) {
		this.setState({ isLoading: v });
	};

	setDisabled (v: boolean) {
		const node = $(this.node);
		v ? node.addClass('disabled') : node.removeClass('disabled');
	};
	
};

export default Button;