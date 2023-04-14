import * as React from 'react';
import sha1 from 'sha1';
import { Input } from  'Component';
import { keyboard } from 'Lib';
import Constant from 'json/constant.json';

interface Props {
	/** the length of the pin, defaults to Constant.pinLength */
	pinLength: number;
	/** the expected pin, encrypted in sha1. if none provided, this component does not make a comparison onPinEntry */
	expectedPin: string | null;
	/** if true, the input field will be focused on component mount */
	focusOnMount: boolean;
	/** callback when the pin is entered (and matches expectedPin if provided)*/
	onSuccess?: (value: string) => void;
	/** callback when the pin is entered (and does not match expectedPin if provided)*/
	onError?: () => void;
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
	};

	state = {
		index: 0,
	};

	inputRefs = [];

	// This timeout is used so that the input boxes first show the inputted value as text, then hides it as password showing (•)
	timeout = 0;

	render () {
		const { pinLength } = this.props;
		const { index } = this.state;

		return (
			<div className="pin" onClick={this.onClick}>
				{Array(pinLength).fill(null).map((_, i) => (
					<Input 
						className={i === index ? 'active' : ''}
						ref={ref => this.inputRefs[i] = ref} 
						maxLength={1} 
						key={i} 
						onFocus={() => this.onInputFocus(i)} 
						onBlur={() => this.onInputBlur(i)} 
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
	onPinEntry = () => {
		const { expectedPin, onSuccess, onError } = this.props;
		const pin = this.getPin();
		const success = !expectedPin || (expectedPin === sha1(pin));

		// Reset State
		this.setState({ index: 0 }, () => {
			//this.clearPin();
			this.focus();	
		});

		success ? onSuccess(pin) : onError();
	};

	/** returns the pin state stored in the input DOM */
	getPin = () => {
		return this.inputRefs.map((input) => input.getValue()).join('');
	};

	/** sets all the input boxes to empty string */
	clearPin = () => {
		for (const i in this.inputRefs) {
			this.inputRefs[i].setValue('');
		};
	};

	// Input subcomponent methods

	onInputFocus = (index: number) => {
		this.setState({ index });
	};

	onInputBlur = (index: number) => {
		this.inputRefs[index].removeClass('active');
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
		const pin = this.getPin();

		if (pin.length === size) {
			this.onPinEntry();
		};
	};

	onInputChange = (index: number, value: string) => {
		const input = this.inputRefs[index];
		const next = this.inputRefs[index + 1];

		if (!value) {
			input.setType('text');
			return;
		}

		if (next) {
			next.focus();
		};

		this.timeout = window.setTimeout(() => input.setType('password'), TIMEOUT_DURATION);
	};

};

export default Pin;