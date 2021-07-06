import * as React from 'react';

interface Props {
	id?: string;
	value?: boolean;
	color?: string;
	className?: string;
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
		const { id, color, className } = this.props;
		const { value } = this.state;
		
		let cn = [ 'switch', color ];
		if (className) {
			cn.push(className);
		};
		if (value) {
			cn.push('active');
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
		const { onChange } = this.props;
		const { value } = this.state;
		
		this.setValue(!value);
		
		if (this.props.onChange) {
			this.props.onChange(e, !value);
		};
	};
	
	setValue (v: boolean) {
		this.setState({ value: v });
	};
	
	getValue () {
		return this.state.value;
	};
	
};

export default Switch;