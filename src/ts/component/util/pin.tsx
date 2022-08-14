import * as React from 'react';
import { Input } from  'Component';
import { keyboard } from 'Lib';

interface Props {
	size?: number;
	value?: string;
	focus?: boolean;
	onSuccess?: (value: string) => void;
	onError?: () => void;
};

const Constant: any = require('json/constant.json');
const sha1 = require('sha1');

class Pin extends React.Component<Props, {}> {

	public static defaultProps = {
		size: Constant.pinSize,
		focus: true,
		value: '',
	};

	n: number = 0;
	refObj: any = {};
	timeout: number = 0;

	render () {
		const { size } = this.props;
		const inputs = [];

		for (let i = 1; i <= size; ++i) {
			inputs.push({ id: i });
		};

		return (
			<div className="pin">
				{inputs.map((item: any, i: number) => (
					<Input 
						ref={(ref: any) => this.refObj[item.id] = ref} 
						maxLength={1} 
						key={i} 
						onFocus={(e) => { this.onFocus(e, item.id); }} 
						onBlur={(e) => { this.onBlur(e, item.id); }} 
						onKeyUp={(e: any, value: string) => { this.onKeyUp(e, item.id, value); }} 
						onKeyDown={(e: any, value: string) => { this.onKeyDown(e, item.id, value); }} 
						onChange={(e: any, value: string) => { this.onChange(e, item.id, value); }} 
					/>
				))}
			</div>
		);
	};

	componentDidMount () {
		this.init();
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
	};

	init () {
		if (this.props.focus) {
			this.focus();
		};
	};

	focus () {
		this.refObj[(this.n || 1)].focus();
	};

	onFocus (e: any, id: number) {
		this.n = id;
		this.refObj[id].addClass('active');
	};

	onBlur (e: any, id: number) {
		this.refObj[id].removeClass('active');
	};

	onKeyDown (e: any, id: number, value: string) {
		const prev = this.refObj[id - 1];

		if (prev) {
			keyboard.shortcut('backspace', e, (pressed: string) => {
				prev.setValue('');
				prev.setType('text');
				prev.focus();
			});
		};
	};

	onKeyUp (e: any, id: number, value: string) {
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
			this.clear();
			this.init();

			onError();
		};
	};

	get () {
		let c: string[] = [];
		for (let i in this.refObj) {
			c.push(this.refObj[i].getValue());
		};
		return c.join('');
	};

	clear () {
		for (let i in this.refObj) {
			this.refObj[i].setValue('');
		};
	};
	
};

export default Pin;