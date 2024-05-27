import * as React from 'react';
import sha1 from 'sha1';
import { Input } from 'Component';
import { keyboard } from 'Lib';
const Constant = require('json/constant.json');

interface Props {
	/** the length of the pin, defaults to Constant.pinLength */
	pinLength?: number;
	/** the expected pin, encrypted in sha1. if none provided, this component does not make a comparison check */
	expectedPin?: string | null;
	/** if true, the input field will be focused on component mount */
	focusOnMount?: boolean;
	/** callback when the pin is entered (and matches expectedPin if provided)*/
	onSuccess?: (value: string) => void;
	/** callback when the pin is entered (and does not match expectedPin if provided)*/
	onError?: () => void;
	/** if true, input will not turn to type password after filled*/
	isVisible?: boolean;
};

type State = {
	/** index of the current pin character in focus */
	index: number;
};

/**
 * This component provides an input field for a pin code
 */

const TIMEOUT_DURATION = 150;

class Pin extends React.Component<Props, State> {

	public static defaultProps = {
		pinLength: Constant.pinLength,
		expectedPin: null,
		focusOnMount: true,
		isVisible: false,
	};

	state = {
		index: 0,
	};

	inputRefs = [];

	// This timeout is used so that the input boxes first show the inputted value as text, then hides it as password showing (•)
	timeout = 0;

	render () {
		const { pinLength } = this.props;

		return (
			<div className="pin" onClick={this.onClick}>
				{Array(pinLength).fill(null).map((_, i) => (
					<Input 
						ref={ref => this.inputRefs[i] = ref} 
						maxLength={1} 
						key={i} 
						onPaste={e => this.onPaste(e, i)}
						onFocus={() => this.onInputFocus(i)} 
						onKeyUp={this.onInputKeyUp} 
						onKeyDown={e => this.onInputKeyDown(e, i)} 
						onChange={(_, value) => this.onInputChange(i, value)} 
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
				prev.setType('text');
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
			input.setType('text');
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

	onPaste (e, index: number) {
		e.preventDefault();

		const { pinLength } = this.props;
		const data = e.clipboardData;
		const value = String(data.getData('text/plain') || '').split('');

		for (let i = index; i < pinLength; i++) {
			const input = this.inputRefs[i];
			const char = value[i - index] || '';

			input.setValue(char);
		};

		this.inputRefs[pinLength - 1].focus();
		this.check();
	};

};

export default Pin;
