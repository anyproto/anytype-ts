import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';

const $ = require('jquery');

interface Option {
	id: string;
	name: string;
	icon?: string;
};

interface Props {
	initial?: string;
	value: string;
	options: Option[];
	onChange? (id: string): void;
};

interface State {
	value: string;
	options: Option[];
};

class Select extends React.Component<Props, State> {
	
	private static defaultProps = {
		initial: ''
	};
	
	state = {
		value: '',
		options: [] as Option[]
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
	};
	
	render () {
		const { value, options } = this.state;
		let current: Option = options.find((item: any) => { return item.id == value; });
		
		if (!current) {
			current = options[0];
		};
		
		const Option = (item: any) => (
			<div className={'option ' + (item.id == current.id ? 'active' : '')} onClick={() => { this.onClick(item.id); }}>
				{item.icon ? <Icon className={item.icon} /> : ''}
				<div className="name">{item.name}</div>
			</div>
		);
		
		let cn = [ 'select' ];
		
		return (
			<div className="select">
				{current ? (
					<div className="current" onClick={this.show}>
						{current.icon ? <Icon className={current.icon} /> : ''}
						<div className="name">{current.name}</div>
						<Icon className="arrow" />
					</div>
				) : ''}
				<div className="options">
					{options.map((item: Option, i: number) => {
						return <Option key={i} {...item} />;
					})}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		let { value, options, initial } = this.props;
		let opts = [];
		
		if (initial) {
			opts.unshift({ id: '', name: initial });			
		};

		for (let option of options) {
			opts.push(option);
		};
		
		if (!value && opts.length) {
			value = opts[0].id;
		};
		
		this.setState({ value: value, options: opts });
	};
	
	getValue (): string {
		return String(this.state.value || '');
	};
	
	setValue (v: string) {
		this.setState({ value: v });
		
		if (this.props.onChange) {
			this.props.onChange(v);
		};
	};
	
	show () {
		let node = $(ReactDOM.findDOMNode(this));
		
		this.hide();
		node.find('.options').show();
	};
	
	hide () {
		$('.select .options').hide();
	};
	
	onClick (id: string) {
		this.setValue(id);
		this.hide();
	};
	
};

export default Select;