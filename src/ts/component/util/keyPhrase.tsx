import * as React from 'react';
import $ from 'jquery';
import { setRange } from 'selection-ranges';
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
	value: string
	isBlurred?: boolean,
	isEditable?: boolean
	isInvalid?: boolean
	onChange?: (phrase: string) => void
};

class KeyPhrase extends React.Component<Props> {

	public static defaultProps: Props = {
		value: '',
	};

	node = null;

	constructor (props: Props) {
		super(props);

		this.onInput = this.onInput.bind(this);
	};

	render () {
		const { isBlurred, isEditable, isInvalid } = this.props;
		const cn = [ 'keyPhrase' ];

		if (isBlurred) {
			cn.push('isBlurred');
		};

		if (isInvalid) {
			cn.push('isInvalid');
		};

		return (
			<div
				ref={ref => this.node = ref}
				contentEditable={isEditable}
				suppressContentEditableWarning={true}
				className={cn.join(' ')}
				onInput={this.onInput}
			/>
		);
	};

	componentDidMount () {
		this.setValue(this.props.value);
	};

	componentDidUpdate() {
	};

	focus () {
	};

	setValue (v: string) {
		const node = $(this.node);

		node.html(this.getHtml(v));
	};

	getValue () {
		const node = $(this.node);
		return String(node.get(0).innerText || '').replace(/\s+/g, ' ').trim();
	};

	getHtml (v: string) {
		return String(v || '').split(' ').map((word, index) => {
			const color = COLORS[index % COLORS.length];
			return `<span class="textColor textColor-${color}">${Util.ucFirst(word)}</span>`;
		}).join(' ');
	};

	onInput () {
		this.props.onChange(this.getValue());
	};

};

export default KeyPhrase;