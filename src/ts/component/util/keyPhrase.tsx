import * as React from 'react';

const COLORS = [
	'orange',
	'turquoise',
	'green',
	'blue',
	'yellow',
	'lavender',
	'magenta',
];

type Props = {
	phrase: string
	isBlurred?: boolean,
	isEditable?: boolean
	onChange?: (phrase: string) => void
}

class KeyPhrase extends React.Component<Props> {
	el = React.createRef<HTMLDivElement>();

	constructor(props: Props) {
		super(props);
		this.onInput = this.onInput.bind(this);
	}

	render () {
		const { phrase, isBlurred, isEditable } = this.props;

		const cn = ['keyPhrase'];
		if (isBlurred) {
			cn.push('isBlurred');
		}

		const content = this.getHTML(phrase);

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
		}
		this.replaceCaret(el);
	};

	getHTML (phrase: string) {
		const html = phrase.split(' ').map((word, index) => {
			// rotate through the colors
			const color = COLORS[index % COLORS.length];
			// capitalize each word
			word = word.charAt(0).toUpperCase() + word.slice(1);
			return `<span class="${color}">${word}</span>`
		}).join('');

		if (html === '') {
			return `<span class="${COLORS[0]}"></span>`;
		}
		
		return html;
	};

	onInput (e: any) {
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
		const isTargetFocused = document.activeElement === el;
		if (target !== null && target.nodeValue !== null && isTargetFocused) {
		  const sel = window.getSelection();
		  if (sel !== null) {
			  const range = document.createRange();
			range.setStart(target, target.nodeValue.length);
			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);
		  }
		  el.focus();
		}
	};
};

export default KeyPhrase;