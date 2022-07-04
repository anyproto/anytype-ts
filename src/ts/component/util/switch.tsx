import * as React from 'react';

interface Props {
	id?: string;
	value?: boolean;
	color?: string;
	className?: string;
	readonly?: boolean;
	onChange?(e: any, value: boolean): void;
};

interface State {
	value: boolean;
};

class Switch extends React.Component<Props, State> {

	public static defaultProps = {
		value: false,
		color: 'orange',
	};

	state = {
		value: false
	};

	constructor (props: any) {
		super(props);
		
		this.onChange = this.onChange.bind(this);
	};
	
	render () {
		const { id, color, className, readonly } = this.props;
		const { value } = this.state;
		
		let cn = [ 'switch', color ];
		if (className) {
			cn.push(className);
		};
		if (value) {
			cn.push('active');
		};
		if (readonly) {
			cn.push('isReadonly');
		};
		
		return (
			<div id={id} className={cn.join(' ')} onClick={this.onChange}>
				<div className="inner" />
			</div>
		);
	};
	
	componentDidMount () {
		this.setValue(this.props.value);
	};
	
	onChange (e: any) {
		const { onChange, readonly } = this.props;
		const { value } = this.state;

		if (readonly) {
			return;
		};

		this.setValue(!value);
		
		if (onChange) {
			onChange(e, !value);
		};
	};
	
	setValue (value: boolean) {
		this.setState({ value });
	};
	
	getValue () {
		return this.state.value;
	};
	
};

export default Switch;