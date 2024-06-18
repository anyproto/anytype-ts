import * as React from 'react';
import $ from 'jquery';
import { I, U, Preview } from 'Lib';
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
		this.onClick = this.onClick.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
	};

	render () {
		const { id, type, subType, icon, arrow, text, className, color, onClick, dataset } = this.props;
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
						onClick={this.onClick}
						onMouseDown={this.onMouseDown}
						onMouseEnter={this.onMouseEnter} 
						onMouseLeave={this.onMouseLeave}
						{...U.Common.dataProps(dataset)}
					>
						{isLoading ? <Loader /> : ''}
						{icon ? <Icon className={icon} /> : ''}
						<div className="txt" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} />
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
						{...U.Common.dataProps(dataset)}
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

	onClick (e: any) {
		const { onClick } = this.props;
		const node = $(this.node);

		if (node.hasClass('disabled')) {
			return;
		};

		if (onClick) {
			onClick(e);
		};
	};

	onMouseDown (e: any) {
		const { onMouseDown } = this.props;
		const node = $(this.node);

		if (node.hasClass('disabled')) {
			return;
		};

		if (onMouseDown) {
			onMouseDown(e);
		};
	};

	setLoading (v: boolean) {
		this.setState({ isLoading: v });
	};

	setDisabled (v: boolean) {
		const node = $(this.node);
		v ? node.addClass('disabled') : node.removeClass('disabled');
	};

	isDisabled () {
		return $(this.node).hasClass('disabled');
	};

};

export default Button;
