import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, keyboard, Util, C } from 'ts/lib';
import { Icon } from 'ts/component';
import { observer } from 'mobx-react';
import { menuStore, commonStore, blockStore } from 'ts/store';
import { getRange, setRange } from 'selection-ranges';
import * as Prism from 'prismjs';

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism.css';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};
interface State {
	isEditing: boolean;
};

const raf = require('raf');
const $ = require('jquery');
const katex = require('katex');
const Constant = require('json/constant.json');

require(`prismjs/components/prism-latex.js`);
require('katex/dist/contrib/mhchem.min.js');

const BlockLatex = observer(class BlockLatex extends React.Component<Props, State> {

	_isMounted: boolean = false;
	ref: any = null;
	range: any = { start: 0, end: 0 };
	text: string = '';
	timeout: number = 0;

	state = {
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onMenu = this.onMenu.bind(this);
		this.onTemplate = this.onTemplate.bind(this);
	};

	render () {
		const { readonly, block } = this.props;
		const { isEditing } = this.state;
		const { content } = block;
		const { text } = content;

		return (
			<div className={[ 'wrap', (isEditing ? 'isEditing' : '') ].join(' ')}>
				<div id="select" className="select" onClick={this.onTemplate}>
					<div className="name">Template formula</div>
					<Icon className="arrow light" />
				</div>

				<div id="value" onClick={this.onEdit} />
				<div id="empty" className="empty" onClick={this.onEdit}>
					Here your equation will be rendered with <Icon className="tex" />. Click to edit
				</div>
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
					onKeyDown={this.onKeyDown}
					onChange={this.onChange}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		const { block } = this.props;
		this.text = String(block.content.text || '');

		const length = this.text.length;

		this.rebind();
		this._isMounted = true;
		this.range = { start: length, end: length };
		this.setValue(this.text);
	};

	componentDidUpdate () {
		const { isEditing } = this.state;

		this.rebind();
		this.setValue(this.text);

		if (isEditing) {
			const node = $(ReactDOM.findDOMNode(this));
			const input = node.find('#input');

			setRange(input.get(0), this.range);
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		const { block } = this.props;
		const self = this;

		this.unbind();
		$(window).on('click.latex', (e: any) => {
			if ($(e.target).parents(`#block-${block.id}`).length > 0) {
				return;
			};

			menuStore.close('blockLatex');
			window.clearTimeout(self.timeout);
			self.placeholderCheck(self.getValue());
			self.save(() => { 
				self.setState({ isEditing: false });
			});
		});
	};

	unbind () {
		$(window).unbind('click.latex');
	};

	onKeyDown (e: any) {
		const { filter } = commonStore;
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');
		const el: any = input.get(0);
		const range = getRange(el);

		keyboard.shortcut('backspace', e, (pressed: string) => {
			if (range.start == filter.from) {
				menuStore.close('blockLatex');
			};
		});
	};

	onKeyUp (e: any) {
		const { filter } = commonStore;
		const value = this.getValue();
		const k = e.key.toLowerCase();
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');
		const el: any = input.get(0);
		const range = getRange(el);
		const symbolBefore = value[range?.start - 1];
		
		let menuOpen = menuStore.isOpen('blockLatex');

		if ((symbolBefore == '\\') && !keyboard.isSpecial(k)) {
			commonStore.filterSet(range.start, '');
			this.onMenu(e, 'input', false);
		};

		if (menuOpen) {
			const d = range.start - filter.from;
			if (d >= 0) {
				const part = value.substr(filter.from, d).replace(/^\\/, '');
				commonStore.filterSetText(part);
			};
		};

		this.text = value;
		this.setContent(value);

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.save(); }, 500); 
	};

	updateRect () {
		const win = $(window);

		let rect = Util.selectionRect();
		if (!rect.x && !rect.y && !rect.width && !rect.height) {
			rect = null;
		};

		if (!rect || !menuStore.isOpen('blockLatex')) {
			return;
		};

		menuStore.update('blockLatex', { 
			rect: { ...rect, y: rect.y + win.scrollTop() }
		});
	};

	onChange (e: any) {
		this.setValue(this.getValue());
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur () {
		keyboard.setFocus(false);
		window.clearTimeout(this.timeout);

		this.save();
	};

	onTemplate (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');
		const el: any = input.get(0);
		const range = getRange(el);

		commonStore.filterSet(range?.start, '');
		this.onMenu(e, 'select', true);
	};

	onMenu (e: any, element: string, isTemplate: boolean) {
		const { rootId, block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');
		const el: any = input.get(0);
		const win = $(window);

		raf(() => {
			let rect = null;
			if (element == 'input') {
				rect = Util.selectionRect();
				if (!rect.x && !rect.y && !rect.width && !rect.height) {
					rect = null;
				};
			};

			menuStore.open('blockLatex', {
				rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
				element: `#block-${block.id} #${element}`,
				offsetY: 4,
				offsetX: rect ? 0 : Constant.size.blockMenu,
				commonFilter: true,
				className: (isTemplate ? 'isTemplate' : ''),
				onClose: () => {
					commonStore.filterSet(0, '');
				},
				data: {
					isTemplate: isTemplate,
					rootId: rootId,
					blockId: block.id,
					onSelect: (from: number, to: number, item: any) => {
						this.setValue(Util.stringInsert(this.getValue(), item.symbol || item.comment, from, to));

						const value = this.getValue();
						setRange(el, { start: value.length, end: value.length });
					},
				},
			});
		});
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

		value = String(value || '').trim();

		if (val.length) {
			val.html(value ? katex.renderToString(value, { 
				displayMode: true, 
				throwOnError: false,
				output: 'html',
			}) : '');
		};

		this.placeholderCheck(value);
		this.updateRect();
	};

	placeholderCheck (value: string) {
		const node = $(ReactDOM.findDOMNode(this));
		const empty = node.find('#empty');

		value = value.trim();
		value.length ? empty.hide() : empty.show();
	};

	onEdit (e: any) {
		const { block, readonly } = this.props;
		if (readonly) {
			return;
		};

		e.stopPropagation();
		this.setState({ isEditing: true });
	};

	save (callBack?: (message: any) => void) {
		const { rootId, block, readonly } = this.props;
		if (readonly) {
			return;
		};

		const value = this.getValue();
		const param = { 
			...block, 
			content: { 
				...block.content, 
				text: value,
			},
		};

		blockStore.update(rootId, param);
		C.BlockUpdateContent(param, rootId, block.id, callBack);
	};

	onSelect (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');

		this.range = getRange(input.get(0));
		
		selection.preventSelect(true);
		$(window).unbind('mouseup.latex').on('mouseup.latex', (e: any) => {	
			selection.preventSelect(false);
		});
	};
	
});

export default BlockLatex;