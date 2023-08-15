import * as React from 'react';
import $ from 'jquery';
import { I, Relation } from 'Lib';
import { Icon, MenuItemVertical } from 'Component';
import { menuStore } from 'Store';

interface Props {
	id: string;
	initial?: string;
	className?: string;
	arrowClassName?: string;
	element?: string;
	value: any;
	options: I.Option[];
	noFilter: boolean;
	isMultiple?: boolean;
	readonly?: boolean;
	menuParam?: Partial<I.MenuParam>;
	onChange? (id: any): void;
};

interface State {
	value: string[];
	options: I.Option[];
};

class Select extends React.Component<Props, State> {
	
	public static defaultProps = {
		initial: '',
		noFilter: true,
	};
	
	_isMounted = false;
	state = {
		value: [],
		options: [] as I.Option[]
	};
	
	constructor (props: Props) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
	};
	
	render () {
		const { id, className, arrowClassName, readonly, isMultiple } = this.props;
		const { options } = this.state;
		const cn = [ 'select' ];
		const acn = [ 'arrow', (arrowClassName ? arrowClassName : '') ];
		const value = Relation.getArrayValue(this.state.value);
		const current: any[] = [];

		if (className) {
			cn.push(className);
		};

		if (readonly) {
			cn.push('isReadonly');
		};
		
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

		const options = this.getOptions();
		
		let value = Relation.getArrayValue(this.props.value);
		if (!value.length && options.length) {
			value = [ options[0].id ];
		};

		this.setState({ value, options });
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	getOptions () {
		const { initial } = this.props;
		const options = [];
		
		if (initial) {
			options.push({ id: '', name: initial, isInitial: true });			
		};
		for (const option of this.props.options) {
			options.push(option);
		};
		return options;
	};

	setOptions (options: any[]) {
		this.setState({ options });
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
	
	show (e: React.MouseEvent) {
		e.stopPropagation();

		const { id, onChange, noFilter, isMultiple, readonly } = this.props;
		const { value, options } = this.state;
		const elementId = `#select-${id}`;
		const element = this.props.element || elementId;

		if (readonly) {
			return;
		};

		const mp = this.props.menuParam || {};
		const menuParam = Object.assign({ 
			element,
			noFlipX: true,
			onOpen: () => {
				window.setTimeout(() => { $(element).addClass('active'); });
			},
			onClose: () => { $(element).removeClass('active'); },
		}, mp);

		menuParam.data = Object.assign({
			noFilter,
			noClose: true,
			value,
			options,
			onSelect: (e: any, item: any) => {
				let { value } = this.state;
				
				if (item.id !== '') {
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
		}, mp.data || {});

		menuStore.closeAll([ 'select' ], () => {
			menuStore.open('select', menuParam);
		});
	};
	
	hide () {
		menuStore.close('select');
	};
	
};

export default Select;