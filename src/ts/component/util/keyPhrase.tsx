import * as React from 'react';
import { Util } from 'Lib';

const COLORS = [
	'orange',
	'red',
	'pink',
	'purple',
	'blue',
	'ice',
	'lime',
];

type Props = {
	phrase: string
	isBlurred?: boolean,
	isEditable?: boolean
	isInvalid?: boolean
	onChange?: (phrase: string) => void
};

class KeyPhrase extends React.Component<Props> {

	public static defaultProps: Props = {
		phrase: '',
	};

	el = React.createRef<HTMLDivElement>();

	constructor (props: Props) {
		super(props);

		this.onInput = this.onInput.bind(this);
	};

	render () {
		const { isBlurred, isEditable, isInvalid } = this.props;
		const content = this.getHTML();
		const cn = ['keyPhrase'];

		if (isBlurred) {
			cn.push('isBlurred');
		};

		if (isInvalid) {
			cn.push('isInvalid');
		};

		return (
			<div
				ref={this.el}
				contentEditable={isEditable}
				suppressContentEditableWarning={true}
				className={cn.join(' ')}
				onInput={this.onInput}
				dangerouslySetInnerHTML={{__html: content }}
			/>
		);
	};

	componentDidUpdate() {
		const el = this.el.current;
		if (!el) {
			return;
		};

		this.replaceCaret(el);
	};

	getHTML () {
		const { phrase } = this.props;

		return phrase.split(' ').map((word, index) => {
			const color = COLORS[index % COLORS.length];
			return `<span class="textColor textColor-${color}">${Util.ucFirst(word)}</span>`;
		}).join('');
	};

	onInput (e) {
		const { innerText } = e.target;

		// normalize whitespace
		const phrase = innerText.replace(/\s+/g, ' ').trim();

		this.props.onChange(phrase);
	}

	replaceCaret (el: HTMLElement) {
		// Place the caret at the end of the element
		const target = document.createTextNode('');

		el.appendChild(target);

		// do not move caret if element was not focused
		const isTargetFocused = document.activeElement == el;

		if (target !== null && target.nodeValue !== null && isTargetFocused) {
			const sel = window.getSelection();
			if (!sel) {
				return;
			};

			const range = document.createRange();

			range.setStart(target, target.nodeValue.length);
			range.collapse(true);

			sel.removeAllRanges();
			sel.addRange(range);

			el.focus();
		};
	};

};

export default KeyPhrase;