import * as React from 'react';
import sha1 from 'sha1';
import { Input } from  'Component';
import { keyboard } from 'Lib';
import Constant from 'json/constant.json';

interface Props {
	size?: number;
	value?: string;
	focus?: boolean;
	onSuccess?: (value: string) => void;
	onError?: () => void;
};


class Pin extends React.Component<Props> {

	public static defaultProps = {
		size: Constant.pinSize,
		focus: true,
		value: '',
	};

	n = 0;
	refObj: any = {};
	timeout = 0;

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { size } = this.props;
		const inputs = [];

		for (let i = 1; i <= size; ++i) {
			inputs.push({ id: i });
		};

		return (
			<div className="pin" onClick={this.onClick}>
				{inputs.map((item: any, i: number) => (
					<Input 
						ref={ref => this.refObj[item.id] = ref} 
						maxLength={1} 
						key={i} 
						onFocus={(e) => { this.onFocus(e, item.id); }} 
						onBlur={(e) => { this.onBlur(e, item.id); }} 
						onKeyUp={() => { this.onKeyUp(); }} 
						onKeyDown={(e: any) => { this.onKeyDown(e, item.id); }} 
						onChange={(e: any, value: string) => { this.onChange(e, item.id, value); }} 
					/>
				))}
			</div>
		);
	};

	componentDidMount () {
		this.init();
		this.rebind();
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
		this.unbind();
	};

	init () {
		if (this.props.focus) {
			this.focus();
		};
	};

	rebind () {
		this.unbind();
		$(window).on('mousedown.pin', (e: any) => { e.preventDefault(); });
	};

	unbind () {
		$(window).off('mousedown.pin');
	}; 

	focus () {
		this.refObj[(this.n || 1)].focus();
	};

	onClick () {
		this.focus();
	};

	onFocus (e: any, id: number) {
		this.n = id;
		this.refObj[id].addClass('active');
	};

	onBlur (e: any, id: number) {
		this.refObj[id].removeClass('active');
	};

	onKeyDown (e: any, id: number) {
		const prev = this.refObj[id - 1];

		if (prev) {
			keyboard.shortcut('backspace', e, () => {
				prev.setValue('');
				prev.setType('text');
				prev.focus();
			});
		};
	};

	onKeyUp () {
		const { size } = this.props;
		const pin = this.get();

		if (pin.length == size) {
			this.onFill();
		};
	};

	onChange (e: any, id: number, value: string) {
		const input = this.refObj[id];
		const next = this.refObj[id + 1];
		
		if (value) {
			if (next) {
				next.focus();
			};
			this.timeout = window.setTimeout(() => { input.setType('password'); }, 150);
		} else {
			input.setType('text');
		};
	};

	onFill () {
		const { value, onSuccess, onError } = this.props;
		const pin = this.get();

		if (!value || (value == sha1(pin))) {
			onSuccess(pin);
		} else {
			this.n = 1;
			this.clear();
			this.init();
			this.focus();

			onError();
		};
	};

	get () {
		const c: string[] = [];
		for (const i in this.refObj) {
			c.push(this.refObj[i].getValue());
		};
		return c.join('');
	};

	clear () {
		for (const i in this.refObj) {
			this.refObj[i].setValue('');
		};
	};
	
};

export default Pin;