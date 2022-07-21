import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface Props {
	id?: string;
	value?: boolean;
	color?: string;
	className?: string;
	readonly?: boolean;
	onChange?(e: any, value: boolean): void;
};

class Switch extends React.Component<Props, {}> {

	public static defaultProps = {
		value: false,
		color: 'orange',
	};

	value: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onChange = this.onChange.bind(this);
	};
	
	render () {
		const { id, color, className, readonly } = this.props;
		
		let cn = [ 'switch', color ];
		if (className) {
			cn.push(className);
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
		const node = $(ReactDOM.findDOMNode(this));

		this.value = value;
		value ? node.addClass('active') : node.removeClass('active');
	};
	
	getValue () {
		return this.value;
	};
	
};

export default Switch;