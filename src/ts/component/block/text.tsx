import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Select } from 'ts/component';
import { I, keyboard, Key, Util, Mark, dispatcher, focus } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { getRange } from 'selection-ranges';
import 'highlight.js/styles/github.css';

interface Props extends I.BlockText {
	rootId: string;
	commonStore?: any;
	blockStore?: any;
	dataset?: any;
	onToggle?(e: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onKeyDown?(e: any): void;
	onKeyUp?(e: any): void;
};

const com = require('proto/commands.js');
const { ipcRenderer } = window.require('electron');
const low = window.require('lowlight');
const rehype = require('rehype');
const Constant = require('json/constant.json');
const $ = require('jquery');

@inject('commonStore')
@inject('blockStore')
@observer
class BlockText extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	refLang: any = null;
	range: any = null;
	timeoutKeyUp: number = 0;
	from: number = 0;
	length: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onCheck = this.onCheck.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onLang = this.onLang.bind(this);
	};

	render () {
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });

		if (!block) {
			return null;
		};
		
		let { fields, content } = block;
		let { text, marks, style, checked, number } = content;
		let { lang } = fields;
		let markers: any[] = [];
		let placeHolder = 'Type anything...';
		let cn = [ 'flex' ];
		let additional = null;
		
		if (style == I.TextStyle.Bulleted) {
			markers.push({ type: I.TextStyle.Bulleted, className: 'bullet', active: false, onClick: () => {} });
		};
		if (style == I.TextStyle.Numbered) {
			markers.push({ type: I.TextStyle.Numbered, className: 'number', active: false, onClick: () => {} });
		};
		if (style == I.TextStyle.Toggle) {
			markers.push({ type: 0, className: 'toggle', active: false, onClick: this.onToggle });
		};
		if (style == I.TextStyle.Checkbox) {
			markers.push({ type: 0, className: 'check', active: checked, onClick: this.onCheck });
		};
		
		let editor = (
			<div
				className="value"
				contentEditable={true}
				suppressContentEditableWarning={true}
				onKeyDown={this.onKeyDown}
				onKeyUp={this.onKeyUp}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				onSelect={this.onSelect}
			>
			</div>
		);
		
		let Marker = (item: any) => (
			<div className={[ 'marker', item.className, (item.active ? 'active' : '') ].join(' ')} onClick={item.onClick}>
				{(item.type == I.TextStyle.Numbered) && number ? number + '.' : <Icon />}
			</div>
		);
		
		switch (style) {
			default:
			case I.TextStyle.Paragraph:
				cn.push('text');
				break;
				
			case I.TextStyle.Title:
				cn.push('title');
				placeHolder = Constant.untitled;
				break;
				
			case I.TextStyle.Header1:
				cn.push('header1');
				break;
				
			case I.TextStyle.Header2:
				cn.push('header2');
				break;
				
			case I.TextStyle.Header3:
				cn.push('header3');
				break;
				
			case I.TextStyle.Quote:
				cn.push('quote');
				break;
				
			case I.TextStyle.Code:
				cn.push('code');
				
				let options = [];
				for (let i in Constant.codeLang) {
					options.push({ id: i, name: Constant.codeLang[i] });
				};
				
				additional = (
					<Select initial="Language" id="lang" value={lang} ref={(ref: any) => { this.refLang = ref; }} options={options} onChange={this.onLang} />
				);
				break;
		};
		
		return (
			<div className={cn.join(' ')}>
				<div className="markers">
					{markers.map((item: any, i: number) => (
						<Marker key={i} {...item} />
					))}
				</div>
				{additional}
				<div className="wrap">
					<span className="placeHolder">{placeHolder}</span>
					{editor}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.setValue();
	};
	
	componentDidUpdate () {
		this.setValue();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeoutKeyUp);
	};
	
	setValue () {
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		const { fields, content } = block;
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		
		let { lang } = fields;
		let { text, style, marks } = content;
		
		text = String(text || '');
		lang = String(lang || 'js');
		
		if ((style == I.TextStyle.Title) && (text == Constant.untitled)) {
			text = '';
		};
		
		let html = '';
		if (style == I.TextStyle.Code) {
			let res = low.highlight(lang, text);
			html = res.value ? rehype().stringify({ type: 'root', children: res.value }).toString() : text;
		} else {
			html = Mark.toHtml(text, marks);
		};
		
		value.html(html);
		value.find('a').unbind('click.link').on('click.link', function (e: any) {
			e.preventDefault();
			ipcRenderer.send('urlOpen', $(this).attr('href'));
		});
	};
	
	getValue () {
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		
		return String(value.text() || '');
	};
	
	onKeyDown (e: any) {
		const { onKeyDown, id } = this.props;
		const range = this.getRange();
		
		this.from = range.from;
		this.length = this.getValue().length;
		
		focus.set(id, range);
		this.placeHolderCheck();
		onKeyDown(e);
	};
	
	onKeyUp (e: any) {
		const { onKeyUp, id, content } = this.props;
		const range = this.getRange();
		const k = e.which;
		
		let value = this.getValue();
		let marks = content.marks;
		let diff = value.length - this.length;
		
		if (diff != 0) {
			marks = Mark.move(marks, this.from, diff);
		};
		
		this.placeHolderCheck();
		onKeyUp(e);
		
		window.clearTimeout(this.timeoutKeyUp);
		this.timeoutKeyUp = window.setTimeout(() => { this.blockUpdateText(marks); }, 500);
	};
	
	blockUpdateText (marks: I.Mark[]) {
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		
		let block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		let value = this.getValue();
		let text = String(block.content.text || '');
		
		if (value == text) {
			return;
		};
		
		let request = {
			contextId: rootId,
			blockId: id,
			text: value,
			marks: { marks: Mark.checkRanges(value, marks) },
		};
		
		dispatcher.call('blockSetTextText', request, (errorCode: any, message: any) => {});
	};
	
	blockUpdateMarks (marks: I.Mark[]) {
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		
		let block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		let request = {
			contextId: rootId,
			blockId: id,
			text: String(block.content.text || ''),
			marks: { marks: Mark.checkRanges(block.content.text, marks) },
		};
		
		dispatcher.call('blockSetTextText', request, (errorCode: any, message: any) => {});
	};
	
	onFocus (e: any) {
		const { onFocus } = this.props;
		
		this.placeHolderCheck();
		keyboard.setFocus(true);
		onFocus(e);
	};
	
	onBlur (e: any) {
		const { commonStore, onBlur } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const placeHolder = node.find('.placeHolder');
		
		placeHolder.hide();
		keyboard.setFocus(false);
		onBlur(e);
	};
	
	onToggle (e: any) {
		this.props.onToggle(e);
	};
	
	onCheck (e: any) {
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });

		if (!block) {
			return;
		};
		
		focus.clear();
		
		let { content } = block;
		let request: any = {
			contextId: rootId,
			blockId: id,
			checked: !content.checked,
		};
		
		dispatcher.call('blockSetTextChecked', request, (errorCode: any, message: any) => {});
	};
	
	onLang (value: string) {
		console.log('lang', value);
	};
	
	onSelect (e: any) {
		const { commonStore, id, rootId, content } = this.props;
		const { from, to } = focus.range;
		
		focus.set(id, this.getRange());
		
		const { range } = focus;
		const currentFrom = range.from;
		const currentTo = range.to;
		
		if (currentTo && (currentFrom != currentTo) && (from != currentFrom || to != currentTo)) {
			
			const node = $(ReactDOM.findDOMNode(this));
			const offset = node.offset();
			const rect = window.getSelection().getRangeAt(0).getBoundingClientRect() as DOMRect;
			
			const x = rect.x - offset.left + Constant.size.blockMenu - Constant.size.menuBlockContext / 2 + rect.width / 2;
			const y = rect.y - (offset.top - $(window).scrollTop()) - 4;
			
			commonStore.menuOpen('blockContext', { 
				element: 'block-' + id,
				type: I.MenuType.Horizontal,
				offsetX: x,
				offsetY: -y,
				vertical: I.MenuDirection.Top,
				horizontal: I.MenuDirection.Left,
				data: {
					blockId: id, 
					rootId: rootId,
					onChange: (marks: I.Mark[]) => {
						focus.set(id, { from: currentTo, to: currentTo });
						this.blockUpdateMarks(marks);
					},
				},
			});
		};
	};
	
	placeHolderCheck () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value').text();
		const placeHolder = node.find('.placeHolder');
		
		value.length ? placeHolder.hide() : placeHolder.show();
	};
	
	getRange (): I.TextRange {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('.value').get(0) as Element) || { start: 0, end: 0 };
		
		return { from: range.start, to: range.end };
	};
	
};

export default BlockText;