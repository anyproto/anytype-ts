import * as React from 'react';
import sha1 from 'sha1';
import { Input } from 'Component';
import { J, keyboard } from 'Lib';

interface Props {
	isNumeric?: boolean;
	pinLength?: number;
	expectedPin?: string | null;
	focusOnMount?: boolean;
	onSuccess?: (value: string) => void;
	onError?: () => void;
	isVisible?: boolean;
};

type State = {
	index: number;
};

/**
 * This component provides an input field for a pin code
 */

const TIMEOUT_DURATION = 150;

class Pin extends React.Component<Props, State> {

	public static defaultProps = {
		pinLength: 6,
		expectedPin: null,
		focusOnMount: true,
		isVisible: false,
		isNumeric: false,
	};

	state = {
		index: 0,
	};

	inputRefs = [];

	// This timeout is used so that the input boxes first show the inputted value as text, then hides it as password showing (•)
	timeout = 0;

	render () {
		const { pinLength, isNumeric } = this.props;
	
		let props = {
			maxLength: 1,
			onKeyUp: this.onInputKeyUp,
		};

		if (isNumeric) {
			props = Object.assign(props, {
				type: 'number',
				pattern: '[0-9]{1}',
				inputMode: 'numeric',
				noValidate: true,
			});
		};

		return (
			<div className="pin" onClick={this.onClick}>
				{Array(pinLength).fill(null).map((_, i) => (
					<Input 
						ref={ref => this.inputRefs[i] = ref} 
						key={i} 
						onPaste={e => this.onPaste(e, i)}
						onFocus={() => this.onInputFocus(i)} 
						onKeyDown={e => this.onInputKeyDown(e, i)} 
						onChange={(_, value) => this.onInputChange(i, value)} 
						{...props}
					/>
				))}
			</div>
		);
	};

	componentDidMount () {
		if (this.props.focusOnMount) {
			this.focus();
		};
		this.rebind();
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
		this.unbind();
	};

	rebind = () => {
		this.unbind();
		$(window).on('mousedown.pin', e => { e.preventDefault(); });
	};

	unbind = () => {
		$(window).off('mousedown.pin');
	}; 

	focus = () => {
		this.inputRefs[this.state.index].focus();
	};

	onClick = () => {
		this.focus();
	};

	/** triggers when all the pin characters have been entered in, resetting state and calling callbacks */
	check = () => {
		const { expectedPin } = this.props;
		const pin = this.getValue();
		const success = !expectedPin || (expectedPin === sha1(pin));
		const onSuccess = this.props.onSuccess || (() => {});
		const onError = this.props.onError || (() => {});

		success ? onSuccess(pin) : onError();
	};

	/** returns the pin state stored in the input DOM */
	getValue = () => {
		return this.inputRefs.map((input) => input.getValue()).join('');
	};

	/** sets all the input boxes to empty string */
	clear = () => {
		for (const i in this.inputRefs) {
			this.inputRefs[i].setValue('');
		};
	};

	/** resets state */
	reset () {
		this.setState({ index: 0 }, () => {
			this.clear();
			this.focus();

			for (const i in this.inputRefs) {
				this.inputRefs[i].setType(this.getType());
			};
		});
	};

	// Input subcomponent methods

	onInputFocus = (index: number) => {
		this.setState({ index });
	};

	onInputKeyDown = (e, index: number) => {
		const prev = this.inputRefs[index - 1];

		if (prev) {
			keyboard.shortcut('backspace', e, () => {
				prev.setValue('');
				prev.setType(this.getType());
				prev.focus();
			});
		};
	};

	onInputKeyUp = () => {
		const { pinLength: size } = this.props;
		const pin = this.getValue();

		if (pin.length === size) {
			this.check();
		};
	};

	onInputChange = (index: number, value: string) => {
		const { isVisible } = this.props;
		const input = this.inputRefs[index];
		const next = this.inputRefs[index + 1];

		if (!value) {
			input.setType(this.getType());
			return;
		}

		if (next) {
			next.focus();
		};

		if (isVisible) {
			return;
		};

		this.timeout = window.setTimeout(() => input.setType('password'), TIMEOUT_DURATION);
	};

	async onPaste (e: any, index: number) {
		e.preventDefault();

		const { pinLength } = this.props;
		const text = await navigator.clipboard.readText();
		const value = String(text || '').split('');

		for (let i = index; i < pinLength; i++) {
			const input = this.inputRefs[i];
			const char = value[i - index] || '';

			input.setValue(char);
			input.setType(this.getType());
		};

		this.inputRefs[pinLength - 1].focus();
		this.check();
	};

	getType (): string {
		return this.props.isNumeric ? 'number' : 'text';
	};

};

export default Pin;