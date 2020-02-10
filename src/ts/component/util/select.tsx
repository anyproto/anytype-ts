import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';
import { Icon } from 'ts/component';
import { commonStore } from 'ts/store';

const $ = require('jquery');

interface Option {
	id: string;
	name: string;
	icon?: string;
};

interface Props {
	id: string;
	initial?: string;
	value: string;
	options: Option[];
	horizontal?: I.MenuDirection;
	onChange? (id: string): void;
};

interface State {
	value: string;
	options: Option[];
};

class Select extends React.Component<Props, State> {
	
	private static defaultProps = {
		initial: '',
		horizontal: I.MenuDirection.Left,
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
		const { id } = this.props;
		const { value, options } = this.state;
		let current: Option = options.find((item: any) => { return item.id == value; });
		
		if (!current) {
			current = options[0];
		};
		
		return (
			<div id={'select-' + id} className="select">
				{current ? (
					<div className="current" onClick={this.show}>
						{current.icon ? <Icon className={current.icon} /> : ''}
						<div className="name">{current.name}</div>
						<Icon className="arrow" />
					</div>
				) : ''}
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
		const { id, value, horizontal } = this.props;
		const { options } = this.state;
		const node = $(ReactDOM.findDOMNode(this));
		
		this.hide();
		
		commonStore.menuOpen('select', { 
			element: '#select-' + id,
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: horizontal,
			data: {
				value: value,
				options: options,
				onSelect: (e: any, id: string) => {
					this.setValue(id);
					this.hide();
				}
			}
		});
	};
	
	hide () {
		commonStore.menuClose('select');
	};
	
};

export default Select;