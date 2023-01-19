import * as React from 'react';

interface Props {
	id?: string;
	value?: boolean;
	color?: string;
	className?: string;
	readonly?: boolean;
	onChange?(e: any, value: boolean): void;
};

class Switch extends React.Component<Props> {

	public static defaultProps = {
		value: false,
		color: 'orange',
	};

	node: any = null;
	value = false;

	constructor (props: Props) {
		super(props);
		
		this.onChange = this.onChange.bind(this);
	};
	
	render () {
		const { id, color, className, readonly } = this.props;
		const cn = [ 'switch', color ];

		if (className) {
			cn.push(className);
		};
		if (readonly) {
			cn.push('isReadonly');
		};
		
		return (
			<div 
				ref={node => this.node = node}
				id={id} 
				className={cn.join(' ')} 
				onClick={this.onChange}
			>
				<div className="inner" />
			</div>
		);
	};
	
	componentDidMount () {
		this.setValue(this.props.value);
	};

	componentDidUpdate () {
		this.setValue(this.props.value);
	};
	
	onChange (e: any) {
		const { onChange, readonly } = this.props;

		if (readonly) {
			return;
		};

		const value = !this.value;

		this.setValue(value);
		if (onChange) {
			onChange(e, value);
		};
	};
	
	setValue (value: boolean) {
		const node = $(this.node);

		this.value = value;
		value ? node.addClass('active') : node.removeClass('active');
	};
	
	getValue () {
		return this.value;
	};
	
};

export default Switch;