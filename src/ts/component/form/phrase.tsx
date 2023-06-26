import * as React from 'react';
import $ from 'jquery';
import { getRange, setRange } from 'selection-ranges';
import { Icon } from 'Component';
import { UtilCommon, keyboard, translate } from 'Lib';

interface Props {
	value: string;
	readonly?: boolean;
	isHidden?: boolean;
	onChange?: (phrase: string) => void;
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

const LIMIT = 12;

class Phrase extends React.Component<Props, State> {

	public static defaultProps: Props = {
		value: '',
	};

	state: State = {
		isHidden: true,
		hasError: false,
		phrase: [],
	};

	node = null;
	placeholder = null;
	entry = null;
	timeout = 0;
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
		const { readonly } = this.props;
		const { isHidden, hasError, phrase } = this.state;
		const cn = [ 'phraseWrapper' ];

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

				<div id="placeholder" className="placeholder">{translate('phrasePlaceholder')}</div>
				<Icon className={isHidden ? 'see' : 'hide'} onClick={this.onToggle} />
			</div>
		);
	};

	componentDidMount () {
		const { value, isHidden } = this.props;

		const text = this.normalizeWhiteSpace(value);
		const phrase = text.length ? text.split(' '): [];

		this.init();
		this.setState({ isHidden, phrase });
		this.focus();
	};

	componentDidUpdate () {
		this.init();
		this.placeholderCheck();
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
	};

	init () {
		const node = $(this.node);

		this.placeholder = node.find('#placeholder');
		this.entry = node.find('#entry');
	};

	onClick () {
		this.focus();
	};

	onKeyDown (e: React.KeyboardEvent) {
		keyboard.shortcut('space, enter', e, () => {
			e.preventDefault();
		});

		keyboard.shortcut('backspace', e, () => {
			e.stopPropagation();

			const range = getRange(this.entry.get(0));
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
	};

	onKeyUp (e: React.KeyboardEvent) {
		keyboard.shortcut('space, enter', e, () => {
			e.preventDefault();
			this.updateValue();
		});

		this.placeholderCheck();

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.updateValue(), 1000);
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
		this.setState({ isHidden: !this.state.isHidden });
	};

	checkValue (v: string[]) {
		return v.filter(it => it).slice(0, LIMIT);
	};

	setError (v: boolean) {
		this.setState({ hasError: v })
	};

	focus () {
		this.entry.trigger('focus');
		setRange(this.entry.get(0), this.range || { start: 0, end: 0 });
	};

	clear () {
		this.entry.text('');
	};

	getEntryValue () {
		return this.normalizeWhiteSpace(this.entry.text()).toLowerCase();
	};

	normalizeWhiteSpace = (val: string) => {
		return String(val || '').replace(/\s\s+/g, ' ').trim() || '';
	};

	getValue () {
		return this.state.phrase.join(' ').trim().toLowerCase();
	};

	placeholderCheck () {
		this.getValue().length || this.getEntryValue() ? this.placeholderHide() : this.placeholderShow();	
	};

	placeholderHide () {
		this.placeholder.hide();
	};

	placeholderShow () {
		this.placeholder.show();
	};

};

export default Phrase;