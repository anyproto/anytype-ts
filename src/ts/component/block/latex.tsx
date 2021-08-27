import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, keyboard, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore, commonStore } from 'ts/store';
import { getRange } from 'selection-ranges';
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
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { isEditing } = this.state;

		return (
			<div className={[ 'wrap', (isEditing ? 'isEditing' : '') ].join(' ')} onClick={this.onEdit}>
				<div id="value" />
				{isEditing ? (
					<div 
						id="input"
						contentEditable={!readonly}
						suppressContentEditableWarning={true}
						ref={(ref: any) => { this.ref = ref; }}
						placeholder="Enter text in format LaTeX" 
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
		this._isMounted = true;
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');

		if (isEditing) {
			input.get(0).focus();
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
					},
				}
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
		this.setState({ value: this.getValue() });
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

		let html = value;
		let grammar = Prism.languages.latex;

		html = Prism.highlight(html, grammar, 'latex');

		input.get(0).innerHTML = html;
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

		val.get(0).innerHTML = katex.renderToString(value, { 
			displayMode: true, 
			throwOnError: false,
			output: 'html',
		});
	};

	onEdit (e: any) {
		const { isPopup } = this.props;

		this.setState({ isEditing: true });

		$(Util.getPageContainer(isPopup ? 'popup' : 'page')).unbind('click.latex').on('click.latex', () => {	
			this.setState({ isEditing: false });
		})
	};
	
});

export default BlockLatex;