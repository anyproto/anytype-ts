import * as React from 'react';
import $ from 'jquery';
import { getRange, setRange } from 'selection-ranges';
import { Icon } from 'Component';
import { keyboard, Storage } from 'Lib';
import { popupStore } from 'Store';
const Constant = require('json/constant.json');

interface Props {
	value: string;
	className?: string;
	readonly?: boolean;
	isHidden?: boolean;
	checkPin?: boolean;
	placeholder?: string;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	onChange?: (phrase: string) => void;
	onToggle?: (isHidden: boolean) => void;
	onCopy?: () => void;
	onClick?: (e: any) => void;
};

interface State {
	phrase: string[];
	isHidden: boolean;
	hasError: boolean;
};

const COLORS = [
	'orange',
	'red',
	'pink',
	'purple',
	'blue',
	'ice',
	'lime',
];

class Phrase extends React.Component<Props, State> {

	public static defaultProps: Props = {
		value: '',
		className: '',
	};

	state: State = {
		isHidden: true,
		hasError: false,
		phrase: [],
	};

	node = null;
	refEntry = null;
	refPlaceholder = null;
	range = null;

	constructor (props: Props) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onToggle = this.onToggle.bind(this);
	};

	render () {
		const { readonly, className, onCopy, placeholder } = this.props;
		const { isHidden, hasError, phrase } = this.state;
		const cn = [ 'phraseWrapper', className ];

		if (isHidden) {
			cn.push('isHidden');
		};

		if (hasError) {
			cn.push('hasError');
		};

		if (readonly) {
			cn.push('isReadonly');
		};

		const renderWord = (word: string, index: number) => {
			const color = COLORS[index % COLORS.length];
			const cn = isHidden ? `bg bg-${color}` : `textColor textColor-${color}`;

			return <span className={[ 'word', cn ].join(' ')} key={index}>{word}</span>;
		};

		let placeholderEl = null;
		if (placeholder) {
			placeholderEl = (
				<div 
					ref={ref => this.refPlaceholder = ref} 
					id="placeholder"
					className="placeholder"
				>
					{placeholder}
				</div>
			);
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className={cn.join(' ')}
				onClick={this.onClick}
			>
				<div className="phraseInnerWrapper">
					{!phrase.length ? <span className="word" /> : ''}
					{phrase.map(renderWord)}
					<span 
						ref={ref => this.refEntry = ref}
						id="entry"
						contentEditable={true}
						suppressContentEditableWarning={true} 
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
						onPaste={this.onPaste}
						onBlur={this.onBlur}
						onFocus={this.onFocus}
						onSelect={this.onSelect}
					>
						{'\n'}
					</span>
				</div>

				{placeholderEl}
				<Icon className={isHidden ? 'see' : 'hide'} onClick={this.onToggle} />
				<Icon className="copy" onClick={onCopy} />
			</div>
		);
	};

	componentDidMount () {
		const { value, isHidden } = this.props;

		this.setState({ isHidden });
		this.setValue(value);
		this.focus();
	};

	componentDidUpdate () {
		this.placeholderCheck();
	};

	onClick (e: any) {
		this.focus();

		if (this.props.onClick) {
			this.props.onClick(e);
		};
	};

	onKeyDown (e: React.KeyboardEvent) {
		const { onKeyDown } = this.props;
		const entry = $(this.refEntry);

		keyboard.shortcut('space, enter', e, () => e.preventDefault());

		keyboard.shortcut('backspace', e, () => {
			e.stopPropagation();

			const range = getRange(entry.get(0));
			if (range.start || range.end) {
				return;
			};

			e.preventDefault();

			this.setState(({ phrase }) => {
				phrase.pop();
				return { phrase };
			});
		});

		this.placeholderCheck();

		if (onKeyDown) {
			onKeyDown(e);
		};
	};

	onKeyUp (e: React.KeyboardEvent) {
		keyboard.shortcut('space, enter', e, () => {
			e.preventDefault();
			this.updateValue();
		});

		this.placeholderCheck();
	};

	updateValue () {
		const value = this.getEntryValue();

		if (!value.length) {
			return;
		};

		this.clear();
		this.setState(({ phrase }) => ({ phrase: this.checkValue(phrase.concat([ value ])) }));
	};

	onPaste (e) {
		e.preventDefault();

		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const text = this.normalizeWhiteSpace(cb.getData('text/plain'));

		this.clear();
		this.setState(({ phrase }) => ({ phrase: this.checkValue(phrase.concat(text.split(' '))) }));
	};

	onBlur () {
		this.placeholderCheck();
	};

	onFocus () {
		this.placeholderCheck();
	};

	onSelect () {
		const node = $(this.node);
		const entry = node.find('#entry');

		if (entry.length) {
			this.range = getRange(entry.get(0));
		};
	};

	onToggle () {
		const { checkPin, onToggle } = this.props;
		const { isHidden } = this.state;
		const pin = Storage.get('pin');
		const onSuccess = () => {
			this.setState({ isHidden: !isHidden });

			if (onToggle) {
				onToggle(!isHidden);
			};
		};

		if (isHidden && checkPin && pin) {
			popupStore.open('pin', { data: { onSuccess } });
		} else {
			onSuccess();
		};
	};

	checkValue (v: string[]) {
		return v.map(it => it.substring(0, Constant.limit.phrase.letter)).filter(it => it).slice(0, Constant.limit.phrase.word);
	};

	setError (v: boolean) {
		this.setState({ hasError: v });
	};

	focus () {
		const entry = $(this.refEntry);

		entry.trigger('focus');
		setRange(entry.get(0), this.range || { start: 0, end: 0 });
	};

	clear () {
		$(this.refEntry).text('');
	};

	getEntryValue () {
		return this.normalizeWhiteSpace($(this.refEntry).text()).toLowerCase();
	};

	normalizeWhiteSpace = (val: string) => {
		return String(val || '').replace(/\s\s+/g, ' ').trim() || '';
	};

	setValue (value: string) {
		const text = this.normalizeWhiteSpace(value);
		const phrase = text.length ? text.split(' '): [];

		this.setState({ phrase });
	};

	getValue () {
		return this.state.phrase.join(' ').trim().toLowerCase();
	};

	placeholderCheck () {
		this.getValue().length || this.getEntryValue() ? this.placeholderHide() : this.placeholderShow();	
	};

	placeholderHide () {
		$(this.refPlaceholder).hide();
	};

	placeholderShow () {
		$(this.refPlaceholder).show();
	};

};

export default Phrase;