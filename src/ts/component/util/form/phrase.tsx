import * as React from 'react';
import $ from 'jquery';
import { getRange, setRange } from 'selection-ranges';
import { Icon } from 'Component';
import { Util, keyboard } from 'Lib';

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
	isHidden: boolean;
};

class Phrase extends React.Component<Props, State> {

	public static defaultProps: Props = {
		value: '',
	};

	state = {
		isHidden: true,
	};

	node = null;
	value = '';
	timeout = 0;

	constructor (props: Props) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onPaste = this.onPaste.bind(this);
	};

	render () {
		const { readonly } = this.props;
		const { isHidden } = this.state;
		const cn = [ 'phraseWrapper' ];

		if (isHidden) {
			cn.push('isHidden');
		};

		if (readonly) {
			cn.push('isReadonly');
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
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					onPaste={this.onPaste}
				>
					{'\n'}
				</span>
				<Icon className={isHidden ? 'see' : 'hide'} onClick={this.onToggle} />
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
		this.setValue(this.value);
		this.focus();
	};

	onKeyDown (e: React.KeyboardEvent) {
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
			
			const value = this.getList();
			value.list.pop();

			this.setValue(value.list.join(' '));
		});
	};

	onClick () {
		this.focus();
	};

	onKeyUp (e: React.KeyboardEvent) {
		const value = this.getList();

		keyboard.shortcut('space, enter', e, () => {
			e.preventDefault();

			this.setValue(value.list.concat([ value.new ]).join(' '));
			this.clear();
		});
	};

	onPaste (e) {
		const value = this.getList();
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const text = cb.getData('text/plain');

		this.setValue(value.list.concat([ text ]).join(' '));
		this.clear();
	};

	onToggle () {
		this.setState({ isHidden: !this.state.isHidden });
	};

	focus () {
		const node = $(this.node);
		const entry = node.find('#entry');
		
		if (entry.length) {
			window.setTimeout(() => {
				entry.trigger('focus');
				setRange(entry.get(0), { start: 0, end: 0 });
			});
		};
	};

	clear () {
		const node = $(this.node);
		const entry = node.find('#entry');

		window.setTimeout(() => { entry.text(' '); });
	};

	setError () {
		const node = $(this.node);

		node.addClass('withError');
	};

	getList () {
		const node = $(this.node);
		const phrase = node.find('#phrase');
		const items = phrase.find('.item');
		const entry = node.find('#entry');
		const list = [];

		items.each((i: number, item: any) => {
			item = $(item);

			const w = item.text();

			if (w) {
				list.push(w);
			};
		});

		return {
			list,
			new: (entry.length ? String(entry.text() || '').trim() : ''),
		};
	};

	getValue () {
		return this.value;
	};

	setValue (v: string) {
		v = String(v || '').trim();

		const node = $(this.node);
		const phrase = node.find('#phrase').html('');
		const { isHidden } = this.state;

		this.value = v;

		v.split(' ').forEach((word, index) => {
			const c = COLORS[index % COLORS.length];
			const el = $('<span></span>').addClass('item');
			el.text(Util.ucFirst(word));
			el.addClass(`textColor textColor-${c}`);
			
			if (isHidden) {
				el.addClass(`bgColor bgColor-${c}`);
			}

			phrase.append(el);
		});
	};

};

export default Phrase;