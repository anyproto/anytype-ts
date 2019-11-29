import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Select } from 'ts/component';
import { I, keyboard, Key, Util, dispatcher, focus } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
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
	start: any = null;
	end: any = null;
	selectionStart: any = null;
	selectionEnd: any = null;

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
		let { text, marks, style, marker, toggleable, checkable, checked, number } = content;
		let { lang } = fields;
		let markers: any[] = [];
		let placeHolder = 'Type anything...';
		let cn = [ 'flex' ];
		let additional = null;
		
		if (marker) {
			markers.push({ type: marker, className: 'bullet c' + marker, active: false, onClick: () => {} });
		};
		if (toggleable) {
			markers.push({ type: 0, className: 'toggle', active: false, onClick: this.onToggle });
		};
		if (checkable) {
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
				{(item.type == I.MarkerType.Number) && number ? number + '.' : <Icon />}
			</div>
		);
		
		switch (style) {
			default:
			case I.TextStyle.Paragraph:
				cn.push('p');
				break;
				
			case I.TextStyle.Title:
				cn.push('title');
				placeHolder = Constant.untitled;
				break;
				
			case I.TextStyle.Header1:
				cn.push('h1');
				break;
				
			case I.TextStyle.Header2:
				cn.push('h2');
				break;
				
			case I.TextStyle.Header3:
				cn.push('h3');
				break;
				
			case I.TextStyle.Header4:
				cn.push('h4');
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
			html = this.marksToHtml(text, marks);
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
	
	marksToHtml (text: string, marks: I.Mark[]) {
		if (!marks || !marks.length) {
			return text;
		};
		
		text = String(text || '');
		marks = marks || [];
		
		let r = text.split('');
		let tag = [ 's', 'kbd', 'i', 'b', 'u', 'a', 'span', 'span' ];
		
		for (let mark of marks) {
			let type = mark.type || 0;
			let t = tag[mark.type];
			let attr = '';
			
			if ((type == I.MarkType.Link) && mark.param) {
				attr = 'href="' + mark.param + '"';
			};
			if ((type == I.MarkType.TextColor) && mark.param) {
				attr = 'style="color:' + mark.param + '"';
			};
			if ((type == I.MarkType.BgColor) && mark.param) {
				attr = 'style="background-color:' + mark.param + '"';
			};
			
			if (r[mark.range.from] && r[mark.range.to - 1]) {
				r[mark.range.from] = '<' + t + (attr ? ' ' + attr : '') + '>' + r[mark.range.from];
				r[mark.range.to - 1] += '</' + t + '>';
			};
		};
		return r.join('');
	};
	
	onKeyDown (e: any) {
		const { onKeyDown, id } = this.props;
		const range = this.rangeGet();
		const k = e.which;
		
		if ((this.start === null) && ([ Key.up, Key.down, Key.left, Key.right ].indexOf(k) < 0)) {
			this.start = range.from;
		};
		
		focus.set(id, range);
		
		this.placeHolderCheck();
		onKeyDown(e);
	};
	
	onKeyUp (e: any) {
		const { onKeyUp, id } = this.props;
		const k = e.which;
		
		this.placeHolderCheck();
		onKeyUp(e);
		
		let t = 500;
		let remove = false;
		
		if ([ Key.up, Key.down, Key.left, Key.right ].indexOf(k) >= 0) {
			t = 0;
		};
		
		if (k == Key.backSpace) {
			remove = true;
		};
		
		console.log(k, t);
		
		window.clearTimeout(this.timeoutKeyUp);
		this.timeoutKeyUp = window.setTimeout(() => {
			if ((this.start !== null) && (this.end === null) && ([ Key.up, Key.down, Key.left, Key.right ].indexOf(k) >= 0)) {
				const range = this.rangeGet();
				this.end = range.from;
			};
			this.blockUpdateText(remove);
		}, t);
	};
	
	blockUpdateText (remove: boolean) {
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		
		let block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		let value = this.getValue();
		let text = String(block.content.text || '');
		
		console.log('value', value, this.start, this.end, value.substr(this.start, this.end - this.start));
		
		if (value == text) {
			return;
		};
		
		if (this.start > this.end) {
			let ts = this.start;
			this.start = this.end;
			this.end = ts;
		};
		
		let range = { from: this.start, to: this.start };
		
		if (this.selectionEnd && (this.selectionStart != this.selectionEnd)) {
			range.from = this.selectionStart;
			range.to = this.selectionEnd;
		};
		
		console.log('range', range.from, range.to);
		
		let request = {
			contextId: rootId,
			blockId: id,
			text: remove ? '' : value.substr(this.start, this.end - this.start),
			range: range,
		};
		
		dispatcher.call('blockSetTextTextInRange', request, (errorCode: any, message: any) => {
			this.start = null;
			this.end = null;
			this.selectionStart = null;
			this.selectionEnd = null;
		});
	};
	
	onFocus (e: any) {
		const { onFocus, id } = this.props;
		
		this.placeHolderCheck();
		keyboard.setFocus(true);
		onFocus(e);
	};
	
	onBlur (e: any) {
		const { onBlur } = this.props;
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
	};
	
	onLang (value: string) {
		console.log('lang', value);
	};
	
	onSelect (e: any) {
		const { commonStore, id, rootId, content } = this.props;
		const from = focus.range.from;
		const to = focus.range.to;
		
		focus.set(id, this.rangeGet());
		
		const { range } = focus;
		
		if ((this.selectionStart === null) && (this.selectionEnd === null)) {
			this.selectionStart = range.from;
			this.selectionEnd = range.to;
		};
		
		if (range.to && (range.from != range.to) && (from != range.from || to != range.to)) {
			
			const node = $(ReactDOM.findDOMNode(this));
			const offset = node.offset();
			const rect = window.getSelection().getRangeAt(0).getBoundingClientRect() as DOMRect;
			
			const x = rect.x - offset.left + Constant.size.blockMenu - Constant.size.menuBlockAction / 2 + rect.width / 2;
			const y = rect.y - (offset.top - $(window).scrollTop()) - 4;
			
			commonStore.menuOpen('blockAction', { 
				element: 'block-' + id,
				type: I.MenuType.Horizontal,
				offsetX: x,
				offsetY: -y,
				light: true,
				vertical: I.MenuDirection.Top,
				horizontal: I.MenuDirection.Left,
				onClose: () => {
				},
				data: {
					blockId: id, 
					rootId: rootId,
					content: content
				}
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
	
	rangeGet (): I.TextRange {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('.value').get(0) as Element) || { start: 0, end: 0 };
		
		return { from: range.start, to: range.end };
	};
	
};

export default BlockText;