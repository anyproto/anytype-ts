import * as React from 'react';
import { I, Relation } from 'Lib';
import { Icon, MenuItemVertical } from 'Component';
import { menuStore } from 'Store';

interface Props {
	id: string;
	initial?: string;
	className?: string;
	arrowClassName?: string;
	element?: string;
	menuClassName?: string;
	menuClassNameWrap?: string;
	menuWidth?: number;
	value: any;
	options: I.Option[];
	noFilter: boolean;
	horizontal?: I.MenuDirection;
	isMultiple?: boolean;
	onChange? (id: any): void;
};

interface State {
	value: string[];
	options: I.Option[];
};

const $ = require('jquery');

class Select extends React.Component<Props, State> {
	
	public static defaultProps = {
		initial: '',
		horizontal: I.MenuDirection.Left,
		noFilter: true,
	};
	
	_isMounted: boolean = false;
	state = {
		value: [],
		options: [] as I.Option[]
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
	};
	
	render () {
		const { id, className, arrowClassName } = this.props;
		const { options } = this.state;
		const cn = [ 'select', (className ? className : '') ];
		const acn = [ 'arrow', (arrowClassName ? arrowClassName : '') ];
		const value = Relation.getArrayValue(this.state.value);

		let current: any[] = [];
		
		value.forEach((id: string) => {
			const option = options.find(item => item.id == id);
			if (option) {
				current.push(option);
			};
		});

		if (!current.length && options.length) {
			current.push(options[0]);
		};

		return (
			<div id={'select-' + id} className={cn.join(' ')} onClick={this.show}>
				{current ? (
					<React.Fragment>
						{current.map((item: any, i: number) => (
							<MenuItemVertical key={i} {...item} />
						))}
						<Icon className={acn.join(' ')} />
					</React.Fragment>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		let { initial } = this.props;
		let options = [];
		let value = Relation.getArrayValue(this.props.value);
		
		if (initial) {
			options.push({ id: '', name: initial, isInitial: true });			
		};
		for (let option of this.props.options) {
			options.push(option);
		};
		
		if (!value.length && options.length) {
			value = [ options[0].id ];
		};
		
		this.setState({ value, options });
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	getValue (): any {
		const { isMultiple } = this.props;
		const value = Relation.getArrayValue(this.state.value);
		return isMultiple ? value : value[0];
	};
	
	setValue (v: any) {
		const value = Relation.getArrayValue(v);

		if (this._isMounted) {
			this.state.value = value;
			this.setState({ value });
		};
	};
	
	show () {
		const { id, horizontal, menuClassName, menuClassNameWrap, onChange, menuWidth, noFilter, isMultiple } = this.props;
		const { value, options } = this.state;
		const elementId = `#select-${id}`;
		const element = this.props.element || elementId;
		
		menuStore.open('select', { 
			element,
			horizontal,
			className: menuClassName,
			classNameWrap: menuClassNameWrap,
			width: menuWidth,
			onOpen: () => {
				window.setTimeout(() => { $(element).addClass('active'); });
			},
			onClose: () => { $(element).removeClass('active'); },
			data: {
				noFilter,
				noClose: true,
				value,
				options,
				onSelect: (e: any, item: any) => {
					let { value } = this.state;
					
					if (item.id) {
						if (isMultiple) {
							value = value.includes(item.id) ? value.filter(it => it != item.id) : [ ...value, item.id ];
						} else {
							value = [ item.id ];
						};
					} else {
						value = [];
					};

					this.setValue(value);

					if (onChange) {
						onChange(this.getValue());
					};

					if (!isMultiple) {
						this.hide();
					} else {
						menuStore.updateData('select', { value });
					};
				},
			},
		});
	};
	
	hide () {
		menuStore.close('select');
	};
	
};

export default Select;