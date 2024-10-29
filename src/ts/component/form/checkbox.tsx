import * as React from 'react';

interface Props {
	id?: string;
	value: boolean;
	className?: string;
	readonly?: boolean;
	onChange?(e: any, value: boolean): void;
};

interface State {
	value: boolean;
};

class Checkbox extends React.Component<Props, State> {
	
	_isMounted = false;
	public static defaultProps = {
		value: false
	};

	state = {
		value: false,
	};
	
	constructor (props: Props) {
		super(props);

		this.onChange = this.onChange.bind(this);
	};

	render () {
		const { value } = this.state;
		const { id, className, readonly } = this.props;
		const cn = [ 'icon', 'checkbox' ];

		if (className) {
			cn.push(className);
		};
		if (readonly) {
			cn.push('isReadonly');
		};
		if (value) {
			cn.push('active');
		};
		
		return (
			<div
				id={id}
				className={cn.join(' ')}
				onClick={this.onChange}
			/>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		
		this.setValue(this.props.value);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onChange (e: any) {
		const { readonly } = this.props;
		const { value } = this.state;

		if (readonly) {
			return;
		};

		this.setValue(!value);
		if (this.props.onChange) {
			this.props.onChange(e, !value);
		};
	};
	
	setValue (v: boolean) {
		this.setState({ value: Boolean(v) });
	};
	
	getValue () {
		return this.state.value;
	};

	toggle () {
		this.setValue(!this.getValue());
	};
};

export default Checkbox;
