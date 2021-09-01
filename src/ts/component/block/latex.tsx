import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, keyboard, Util, C } from 'ts/lib';
import { Icon, Select } from 'ts/component';
import { observer } from 'mobx-react';
import { menuStore, commonStore } from 'ts/store';
import { getRange, setRange } from 'selection-ranges';
import * as Prism from 'prismjs';

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism.css';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};
interface State {
	isEditing: boolean;
};

const $ = require('jquery');
const katex = require('katex');

require(`prismjs/components/prism-latex.js`);
require('katex/dist/contrib/mhchem.min.js');

const BlockLatex = observer(class BlockLatex extends React.Component<Props, State> {

	_isMounted: boolean = false;
	ref: any = null;
	range: any = { start: 0, end: 0 };

	state = {
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onMenu = this.onMenu.bind(this);
	};

	render () {
		const { readonly } = this.props;
		const { isEditing } = this.state;

		return (
			<div className={[ 'wrap', (isEditing ? 'isEditing' : '') ].join(' ')}>
				<div id="select" className="select" onClick={(e: any) => { this.onMenu(e, 'select', true); this.onEdit(e); }}>
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
					onChange={this.onChange}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		const { block } = this.props;
		const length = block.content.text.length;

		this._isMounted = true;
		this.range = { start: length, end: length };
		this.setValue(block.content.text);
	};

	componentDidUpdate () {
		const { isEditing } = this.state;

		if (isEditing) {
			const node = $(ReactDOM.findDOMNode(this));
			const input = node.find('#input');

			setRange(input.get(0), this.range);
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	onKeyUp (e: any) {
		const { filter } = commonStore;
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
			this.onMenu(e, 'input', false);
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

	onMenu (e: any, element: string, isTemplate: boolean) {
		const { rootId, block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');
		const el: any = input.get(0);

		menuStore.open('blockLatex', {
			element: `#block-${block.id} #${element}`,
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
					this.setValue(Util.stringInsert(this.getValue(), item.comment || item.name, from, to));

					const value = this.getValue();
					setRange(el, { start: value.length, end: value.length });
				},
			},
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
		const { rootId, block, readonly, isPopup } = this.props;
		const container = Util.getPageContainer(isPopup ? 'popup' : 'page');

		if (readonly) {
			return;
		};

		e.stopPropagation();
		this.setState({ isEditing: true });

		$(window).unbind('click.latex').on('click.latex', (e: any) => {	
			if ($(e.target).parents(`#block-${block.id}`).length > 0) {
				return;
			};

			menuStore.close('blockLatex');

			C.BlockUpdateContent({ 
				...block, 
				content: { 
					...block.content, 
					text: this.getValue(),
				},
			}, rootId, block.id, () => {
				this.setState({ isEditing: false });
			});
		});
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