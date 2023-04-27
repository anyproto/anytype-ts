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
	showPlaceholder: boolean;
};

class Phrase extends React.Component<Props, State> {

	public static defaultProps: Props = {
		value: '',
	};

	state: State = {
		isHidden: true,
		hasError: false,
		showPlaceholder: false,
		phrase: [],
	};

	node = null;
	timeout = 0;

	render () {
		const { readonly } = this.props;
		const { isHidden, hasError, showPlaceholder, phrase } = this.state;
		const cn = [ 'phraseWrapper' ];

		if (isHidden) {
			cn.push('isHidden');
		};

		if (hasError) {
			cn.push('hasError');
		}

		if (readonly) {
			cn.push('isReadonly');
		};

		const renderWord = (word: string, index: number) => {
			const c = COLORS[index % COLORS.length];

			const cn = ['item', 'textColor', `textColor-${c}`];

			if (isHidden) {
				cn.push('bgColor', `bgColor-${c}`);
			}

			return <span className={cn.join(' ')} key={index}>{Util.ucFirst(word)}</span>;
		}

		return (
			<div 
				ref={ref => this.node = ref}
				className={cn.join(' ')}
				onClick={this.onClick}
			>
				<div className="phraseInnerWrapper">
					{ phrase.map(renderWord) }
					{ showPlaceholder ? <span id="placeholder">{translate('phrasePlaceholder')}</span> : null}
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

		this.setState({ isHidden, phrase });
		this.focus();
	};

	onClick = () => {
		this.focus();
	};

	onKeyUp = (e: React.KeyboardEvent) => {
		const entry  = this.getEntryValue();

		keyboard.shortcut('space, enter', e, () => {
			e.preventDefault();

			this.clear();
			
			this.setState(({ phrase }) => ({ phrase: entry.length ? phrase.concat([ entry ]) : [] }));
		});
	};

	onKeyDown = (e: React.KeyboardEvent) => {
		const node = $(this.node);
		const entry = node.find('#entry');

		keyboard.shortcut('space, enter', e, () => {
			e.preventDefault();
		});

		keyboard.shortcut('backspace', e, () => {
			e.stopPropagation();

			const range = getRange(entry.get(0));
			if (range.start || range.end) {
				return;
			};

			e.preventDefault();

			this.setState(({ phrase }) => {
				phrase.pop();
				return { phrase }
			});
		});
	};

	onPaste = (e) => {
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const text = this.normalizeWhiteSpace(cb.getData('text/plain'));

		this.clear();
		this.setState(({ phrase }) => ({ phrase: phrase.concat(text.split(' ')) }));
	};

	onBlur = () => {
		const value = this.getEntryValue();
		this.setState(({ phrase }) => ({ showPlaceholder: phrase.length === 0 && value.length === 0 }));
	}

	onFocus = () => {
		this.setState({ showPlaceholder: false });
	}

	toggleVisibility = () => {
		this.setState({ isHidden: !this.state.isHidden });
	};

	publicsetError = () => {
		this.setState({ hasError: true })
	};

	focus = () => {
		const entry = this.getEntry();
		entry.trigger('focus');
		setRange(entry.get(0), { start: 0, end: 0 });
	};

	clear = () => {
		this.getEntry().text('');
	};

	getEntry = () => {
		const node = $(this.node);
		const entry = node.find('#entry');
		return entry;
	}

	getEntryValue = () => {
		return this.normalizeWhiteSpace(this.getEntry().text());
	};

	normalizeWhiteSpace = (val: string) => {
		return val.replace(/\s\s+/g, ' ').trim() || '';
	}

	getValue = () => {
		return this.state.phrase.join(' ');
	};
};

export default Phrase;