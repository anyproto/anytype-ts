import * as React from 'react';
import { I } from 'ts/lib';
import { Icon } from 'ts/component';
import { commonStore } from 'ts/store';

interface Props {
	id: string;
	initial?: string;
	className?: string;
	arrowClassName?: string;
	value: string;
	options: I.Option[];
	horizontal?: I.MenuDirection;
	onChange? (id: string): void;
};

interface State {
	value: string;
	options: I.Option[];
};

const $ = require('jquery');

class Select extends React.Component<Props, State> {
	
	public static defaultProps = {
		initial: '',
		horizontal: I.MenuDirection.Left,
	};
	
	_isMounted: boolean = false;
	state = {
		value: '',
		options: [] as I.Option[]
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
	};
	
	render () {
		const { id, className, arrowClassName } = this.props;
		const { value, options } = this.state;
		const cn = [ 'select', (className ? className : '') ];
		const acn = [ 'arrow', (arrowClassName ? arrowClassName : '') ];

		let current: I.Option = options.find((item: any) => { return item.id == value; });
		if (!current) {
			current = options[0];
		};
		
		return (
			<div id={'select-' + id} className={cn.join(' ')}>
				{current ? (
					<div className="current" onClick={this.show}>
						{current.icon ? <Icon className={current.icon} /> : ''}
						<div className="name">{current.name}</div>
						<Icon className={acn.join(' ')} />
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		let { value, options, initial } = this.props;
		let opts = [];
		
		if (initial) {
			opts.unshift({ id: '', name: initial, isInitial: true });			
		};

		for (let option of options) {
			opts.push(option);
		};
		
		if (!value && opts.length) {
			value = opts[0].id;
		};
		
		this.setState({ value: value, options: opts });
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	getValue (): string {
		return String(this.state.value || '');
	};
	
	setValue (v: string) {
		if (this._isMounted) {
			this.setState({ value: v });
		};
		if (this.props.onChange) {
			this.props.onChange(v);
		};
	};
	
	show () {
		const { id, value, horizontal } = this.props;
		const { options } = this.state;
		
		commonStore.menuOpen('select', { 
			element: '#select-' + id,
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: horizontal,
			onOpen: () => {
				window.setTimeout(() => {
					$('#select-' + id).addClass('active');
				});
			},
			onClose: () => {
				$('#select-' + id).removeClass('active');
			},
			data: {
				value: value,
				options: options,
				onSelect: (e: any, item: any) => {
					this.setValue(item.id);
					this.hide();
				},
			},
		});
	};
	
	hide () {
		commonStore.menuClose('select');
	};
	
};

export default Select;