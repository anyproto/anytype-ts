import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, keyboard, Util, C } from 'ts/lib';
import { Icon } from 'ts/component';
import { observer } from 'mobx-react';
import { menuStore, commonStore } from 'ts/store';
import { getRange, setRange } from 'selection-ranges';
import * as Prism from 'prismjs';

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism.css';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};
interface State {
	value: string;
	isEditing: boolean;
};

const $ = require('jquery');
const katex = require('katex');

require(`prismjs/components/prism-latex.js`);
require('katex/dist/contrib/mhchem.min.js');

const BlockLatex = observer(class BlockLatex extends React.Component<Props, State> {

	_isMounted: boolean = false;
	ref: any = null;

	state = {
		value: '',
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSelect = this.onSelect.bind(this)
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { isEditing } = this.state;
		const { text } = block.content;

		return (
			<div className={[ 'wrap', (isEditing ? 'isEditing' : '') ].join(' ')} onClick={this.onEdit}>
				<div id="value" />
				<div id="empty" className="empty">
					Here your equation will be rendered with <Icon className="tex" />. Click to edit
				</div>
				{isEditing ? (
					<div 
						id="input"
						contentEditable={!readonly}
						suppressContentEditableWarning={true}
						ref={(ref: any) => { this.ref = ref; }}
						placeholder="Enter text in format LaTeX" 
						onSelect={this.onSelect}
						onFocus={this.onFocus}
						onBlur={this.onBlur}
						onKeyUp={this.onKeyUp} 
						onChange={this.onChange}
					/>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		const { block } = this.props;

		this._isMounted = true;
		this.setValue(block.content.text);
	};

	componentDidUpdate () {
		const { block } = this.props;
		const { isEditing } = this.state;

		this.setValue(block.content.text);

		if (isEditing) {
			const node = $(ReactDOM.findDOMNode(this));
			const input = node.find('#input');

			window.setTimeout(() => {
				input.get(0).focus();
			}, 15);
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	onKeyUp (e: any) {
		const { filter } = commonStore;
		const { rootId, block } = this.props;

		const value = this.getValue();
		const k = e.key.toLowerCase();
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');
		const el: any = input.get(0);
		const range = getRange(el);
		const symbolBefore = value[range.start - 1];
		const menuOpen = menuStore.isOpen('blockLatex');

		if ((symbolBefore == '\\') && !keyboard.isSpecial(k)) {
			commonStore.filterSet(range.start, '');

			menuStore.open('blockLatex', {
				element: `#block-${block.id} #input`,
				commonFilter: true,
				onClose: () => {
					commonStore.filterSet(0, '');
				},
				data: {
					rootId: rootId,
					blockId: block.id,
					onSelect: (from: number, to: number, item: any) => {
						this.setValue(Util.stringInsert(this.getValue(), item.comment || item.name, from, to));

						const value = this.getValue();
						setRange(el, { start: value.length, end: value.length });
					},
				},
			});
		};

		if (menuOpen) {
			const d = range.start - filter.from;
			if (d >= 0) {
				const part = value.substr(filter.from, d).replace(/^\\/, '');
				commonStore.filterSetText(part);
			};
		};

		this.setContent(value);
	};

	onChange (e: any) {
		this.setValue(this.getValue());
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur () {
		keyboard.setFocus(false);
	};

	setValue (value: string) {
		if (!this._isMounted) {
			return '';
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');

		if (input.length) {
			input.get(0).innerHTML = Prism.highlight(value, Prism.languages.latex, 'latex');
		};
		this.setContent(value);
	};

	getValue (): string {
		if (!this._isMounted) {
			return '';
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');

		return String(input.get(0).innerText || '');
	};

	setContent (value: string) {
		if (!this._isMounted) {
			return '';
		};

		const node = $(ReactDOM.findDOMNode(this));
		const val = node.find('#value');
		const empty = node.find('#empty');

		value.length ? empty.hide() : empty.show();

		if (val.length) {

			val.get(0).innerHTML = value ? katex.renderToString(value, { 
				displayMode: true, 
				throwOnError: false,
				output: 'html',
			}) : '';
		};
	};

	onEdit (e: any) {
		const { rootId, block } = this.props;

		e.stopPropagation();
		this.setState({ isEditing: true });

		$(window).unbind('click.latex').on('click.latex', (e: any) => {	
			C.BlockCreate({ 
				...block, 
				id: '',
				content: { 
					...block.content, 
					text: this.getValue(),
				},
			}, rootId, block.id, I.BlockPosition.Replace);
		});
	};

	onSelect (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		selection.preventSelect(true);
		$(window).unbind('mouseup.latex').on('mouseup.latex', (e: any) => {	
			selection.preventSelect(false);
		});
	};
	
});

export default BlockLatex;