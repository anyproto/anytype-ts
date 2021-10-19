import * as React from 'react';
import { I } from 'ts/lib';
import { Icon, MenuItemVertical } from 'ts/component';
import { commonStore, menuStore } from 'ts/store';

interface Props {
	id: string;
	initial?: string;
	className?: string;
	arrowClassName?: string;
	element?: string;
	menuClassName?: string;
	menuClassNameWrap?: string;
	menuWidth?: number;
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
			<div id={'select-' + id} className={cn.join(' ')} onClick={this.show}>
				{current ? (
					<React.Fragment>
						<MenuItemVertical {...current} />
						<Icon className={acn.join(' ')} />
					</React.Fragment>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		let { options, initial } = this.props;
		let opts = [];
		let value = String(this.props.value || '');
		
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
	};
	
	show () {
		const { id, horizontal, element, menuClassName, menuClassNameWrap, onChange, menuWidth } = this.props;
		const { value, options } = this.state;
		
		menuStore.open('select', { 
			element: element || '#select-' + id,
			horizontal: horizontal,
			className: menuClassName,
			classNameWrap: menuClassNameWrap,
			width: menuWidth,
			onOpen: () => {
				window.setTimeout(() => {
					$('#select-' + id).addClass('active');
				});
			},
			onClose: () => {
				$('#select-' + id).removeClass('active');
			},
			data: {
				noFilter: true,
				value: value,
				options: options,
				onSelect: (e: any, item: any) => {
					if (onChange) {
						onChange(item.id);
					};
					this.setValue(item.id);
					this.hide();
				},
			},
		});
	};
	
	hide () {
		menuStore.close('select');
	};
	
};

export default Select;