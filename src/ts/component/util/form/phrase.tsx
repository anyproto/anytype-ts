import * as React from 'react';
import $ from 'jquery';
import { getRange, setRange } from 'selection-ranges';
import { Icon } from 'Component';
import { Util, keyboard, translate } from 'Lib';

const COLORS = [
	'orange',
	'red',
	'pink',
	'purple',
	'blue',
	'ice',
	'lime',
];

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
			const c = COLORS[index % COLORS.length];
			const cn = [ 'item' ];

			if (isHidden) {
				cn.push('bgColor', `bgColor-${c}`);
			} else {
				cn.push('textColor', `textColor-${c}`);
			};

			return <span className={cn.join(' ')} key={index}>{Util.ucFirst(word)}</span>;
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className={cn.join(' ')}
				onClick={this.onClick}
			>
				<div className="phraseInnerWrapper">
					{phrase.map(renderWord)}
					<span id="placeholder" className="placeholder">{translate('phrasePlaceholder')}</span>
					<span 
						id="entry" 
						contentEditable={true}
						suppressContentEditableWarning={true} 
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
						onPaste={this.onPaste}
						onBlur={this.onBlur}
						onFocus={this.onFocus}
					>
						{'\n'}
					</span>
				</div>
				<Icon className={isHidden ? 'see' : 'hide'} onClick={this.toggleVisibility} />
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

	init () {
		const node = $(this.node);

		this.placeholder = node.find('#placeholder');
		this.entry = node.find('#entry');
	};

	onClick = () => {
		this.focus();
	};

	onKeyDown = (e: React.KeyboardEvent) => {
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
				return { phrase }
			});
		});

		this.placeholderCheck();
	};

	onKeyUp = (e: React.KeyboardEvent) => {
		const value = this.getEntryValue();

		keyboard.shortcut('space, enter', e, () => {
			e.preventDefault();

			this.clear();
			this.setState(({ phrase }) => ({ phrase: value.length ? phrase.concat([ value ]) : [] }));
		});

		this.placeholderCheck();
	};

	onPaste = (e) => {
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const text = this.normalizeWhiteSpace(cb.getData('text/plain'));

		this.clear();
		this.setState(({ phrase }) => ({ phrase: phrase.concat(text.split(' ')) }));
	};

	onBlur = () => {
		this.placeholderCheck();
	};

	onFocus = () => {
		this.placeholderCheck();
	};

	toggleVisibility = () => {
		this.setState({ isHidden: !this.state.isHidden });
	};

	publicsetError = () => {
		this.setState({ hasError: true })
	};

	focus = () => {
		this.entry.trigger('focus');
		setRange(this.entry.get(0), { start: 0, end: 0 });
	};

	clear = () => {
		this.entry.text('');
	};

	getEntryValue = () => {
		return this.normalizeWhiteSpace(this.entry.text());
	};

	normalizeWhiteSpace = (val: string) => {
		return val.replace(/\s\s+/g, ' ').trim() || '';
	};

	getValue = () => {
		return this.state.phrase.join(' ');
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