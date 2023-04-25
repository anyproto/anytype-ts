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

class KeyPhrase extends React.Component<Props, State> {

	timeout = 0;

	public static defaultProps: Props = {
		value: '',
	};

	state = {
		isHidden: true,
	};

	node = null;
	refInput = null;

	constructor (props: Props) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { isHidden } = this.state;
		const cw = [ 'keyPhraseWrapper' ];
		const cn = [ 'keyPhrase' ];

		if (isHidden) {
			cw.push('isHidden');
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className={cw.join(' ')}
				onClick={this.onClick}
			>
				<div className={cn.join(' ')} />
				<Input 
					ref={ref => this.refInput = ref} 
					onKeyUp={this.onKeyUp}
				/>
				<Icon className={isHidden ? 'see' : 'hide'} onClick={this.onToggle} />
			</div>
		);
	};

	componentDidMount () {
		const { value } = this.props;

		this.refInput.setValue(value);
		this.setHtml(value);
	};

	componentDidUpdate () {
	};

	focus () {
		const node = $(this.node);
		const phrase = node.find('.keyPhrase');
		const value = this.getValue();
		const length = value.length;

		setRange(phrase.get(0), { start: length, end: length });
	};

	setHtml (v: string) {
		const node = $(this.node);
		const phrase = node.find('.keyPhrase');

		phrase.html(this.getHtml(v));
	};

	getValue () {
		const node = $(this.node);
		const phrase = node.find('.keyPhrase');

		return String(phrase.get(0).innerText || '').replace(/\s+/g, ' ').trim();
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

	onClick () {
		this.refInput.focus();
	};

	onKeyUp () {
		const { onChange } = this.props;
		const node = $(this.node);
		const value = this.refInput.getValue();

		this.setHtml(value);
		this.focus();

		onChange(value);
		node.removeClass('withError');
	};

	onToggle () {
		this.setState({ isHidden: !this.state.isHidden });
	};

	setError () {
		const node = $(this.node);

		node.addClass('withError');
	};

};

export default KeyPhrase;