import * as React from 'react';
import $ from 'jquery';
import { setRange } from 'selection-ranges';
import { Icon, Input } from 'Component';
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

interface Props {
	value: string;
	onChange?: (phrase: string) => void;
};

interface State {
	isHidden: boolean;
};

class Phrase extends React.Component<Props, State> {

	timeout = 0;

	public static defaultProps: Props = {
		value: '',
	};

	state = {
		isHidden: true,
	};

	node = null;

	constructor (props: Props) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { isHidden } = this.state;
		const cn = [ 'phraseWrapper' ];

		if (isHidden) {
			cn.push('isHidden');
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className={cn.join(' ')}
				onClick={this.onClick}
			>
				<div id="phrase" className="phrase" />
				<span 
					id="entry" 
					contentEditable={true}
					suppressContentEditableWarning={true} 
					onFocus={this.onFocus}
					onBlur={this.onBlur}
					onInput={this.onInput}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
				>
					{'\n'}
				</span>
				<Icon className={isHidden ? 'see' : 'hide'} onClick={this.onToggle} />
			</div>
		);
	};

	componentDidMount () {
		const { value } = this.props;

		this.setHtml(value);
	};

	componentDidUpdate () {
	};

	onFocus () {
	};

	onBlur () {
	};

	onInput () {
	};

	onKeyDown () {
	};

	focus () {
		const node = $(this.node);
		const phrase = node.find('.phrase');
		const value = this.getValue();
		const length = value.length;

		setRange(phrase.get(0), { start: length, end: length });
	};

	onClick () {
	};

	onKeyUp () {
	};

	onToggle () {
		this.setState({ isHidden: !this.state.isHidden });
	};

	setError () {
		const node = $(this.node);

		node.addClass('withError');
	};

	getValue () {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		return String(phrase.get(0).innerText || '').replace(/\s+/g, ' ').trim();
	};

	setHtml (v: string) {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		phrase.html(this.getHtml(v));
	};

	getHtml (v: string) {
		v = String(v || '');

		if (!v) {
			return '';
		};

		const { isHidden } = this.state;

		return v.split(' ').map((word, index) => {
			const color = COLORS[index % COLORS.length];
			
			let w = '';
			if (isHidden) {
				w = `<span contenteditable="false" class="rect bgColor bgColor-${color}" style="width: ${9 * word.length}px"></span>`;
			} else {
				w = `<span contenteditable="false" class="textColor textColor-${color}">${Util.ucFirst(word)}</span>`
			};
			return w;
		}).join(' ');
	};

};

export default Phrase;