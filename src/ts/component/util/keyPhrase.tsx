import * as React from 'react';
import $ from 'jquery';
import { setRange } from 'selection-ranges';
import { Icon } from 'Component';
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
	value: string;
	isHidden: boolean;
};

class KeyPhrase extends React.Component<Props, State> {

	public static defaultProps: Props = {
		value: '',
	};

	state = {
		value: '',
		isHidden: true,
	};

	node = null;

	constructor (props: Props) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onToggle = this.onToggle.bind(this);
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
			>
				<div
					contentEditable={true}
					suppressContentEditableWarning={true}
					className={cn.join(' ')}
					onKeyUp={this.onKeyUp}
				/>
				<Icon className={isHidden ? 'see' : 'hide'} onClick={this.onToggle} />
			</div>
		);
	};

	componentDidMount () {
		this.setState({ value: this.props.value });
	};

	componentDidUpdate () {
		this.setValue(this.state.value);
	};

	focus () {
		const node = $(this.node);
		const phrase = node.find('.keyPhrase');
		const value = this.getValue();
		const length = value.length;

		setRange(phrase.get(0), { start: length, end: length });
	};

	setValue (v: string) {
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
				w = `<span class="rect bgColor bgColor-${color}" style="width: ${9 * word.length}px"></span>`;
			} else {
				w = `<span class="textColor textColor-${color}">${Util.ucFirst(word)}</span>`
			};
			return w;
		}).join(' ');
	};

	onKeyUp () {
		const { onChange } = this.props;
		const node = $(this.node);
		const value = this.getValue();

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