import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Select } from 'ts/component';
import { I, C, keyboard, Key, Util, Mark, focus } from 'ts/lib';
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
	onKeyDown?(e: any, text?: string): void;
	onKeyUp?(e: any, text?: string): void;
	onMenuAdd? (id: string): void;
	onPaste? (e: any): void;
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
	from: any = null;
	value: string = '';
	marks: I.Mark[] = [];

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
		this.onPaste = this.onPaste.bind(this);
	};

	render () {
		const { blockStore, id, rootId, fields, content } = this.props;
		const { text, marks, style, checked, number, color, bgColor } = content;
		
		let { lang } = fields;
		let markers: any[] = [];
		let placeHolder = 'Type anything...';
		let cn = [ 'flex' ];
		let ct: string[] = [];
		let additional = null;
		
		if (color) {
			ct.push('textColor textColor-' + color);
		};
		if (bgColor) {
			ct.push('bgColor bgColor-' + bgColor);
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
				onPaste={this.onPaste}
			/>
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
				
			case I.TextStyle.Bulleted:
				markers.push({ type: I.TextStyle.Bulleted, className: 'bullet', active: false, onClick: () => {} });
				break;
				
			case I.TextStyle.Numbered:
				markers.push({ type: I.TextStyle.Numbered, className: 'number', active: false, onClick: () => {} });
				break;
				
			case I.TextStyle.Toggle:
				ct = [];
				markers.push({ type: 0, className: 'toggle', active: false, onClick: this.onToggle });
				break;
				
			case I.TextStyle.Checkbox:
				ct = [];
				markers.push({ type: 0, className: 'check', active: checked, onClick: this.onCheck });
				break;
		};
		
		let Marker = (item: any) => (
			<div className={[ 'marker', item.className, (item.active ? 'active' : '') ].join(' ')} onClick={item.onClick}>
				<span className={ct.join(' ')}>{(item.type == I.TextStyle.Numbered) && number ? number + '.' : <Icon />}</span>
			</div>
		);
		
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
		const { content } = this.props;
		
		this.marks = Util.objectCopy(content.marks);
		this._isMounted = true;
		this.setValue();
	};
	
	componentDidUpdate () {
		const { content } = this.props;
		
		this.marks = Util.objectCopy(content.marks);
		this.setValue();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeoutKeyUp);
	};
	
	setValue () {
		const { blockStore, id, rootId, fields, content } = this.props;
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		
		let { lang } = fields;
		let { text, style, marks, color, bgColor, number } = content;
		
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
		
		if (color) {
			html = '<span ' + Mark.paramToAttr(I.MarkType.TextColor, color) + '>' + html + '</span>';
		};
		if (bgColor) {
			html = '<span ' + Mark.paramToAttr(I.MarkType.BgColor, bgColor) + '>' + html + '</span>';
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
		e.persist();
		
		const { commonStore, blockStore, onKeyDown, id, parentId, rootId } = this.props;
		const range = this.getRange();
		const k = e.which;
		const node = $(ReactDOM.findDOMNode(this));
		const placeHolder = node.find('.placeHolder');
		
		commonStore.menuClose('blockContext');
		
		if (this.from == null) {
			this.from = range.from;
		};
		this.value = this.getValue();
		
		if (k == Key.tab) {
			e.preventDefault();
			
			if (e.shiftKey) {
				C.BlockListMove(rootId, [ id ], parentId, I.BlockPosition.Bottom);
			} else {
				const next = blockStore.getNextBlock(rootId, id, -1);
				if (next) {
					C.BlockListMove(rootId, [ id ], next.id, (parentId == next.parentId ? I.BlockPosition.Inner : I.BlockPosition.Bottom));
				};
			};
		};
		
		if ((k == Key.slash) && !this.value) {
			e.preventDefault();
			this.props.onMenuAdd(id);
		};
		
		if (k == Key.enter) {
			this.blockUpdateText(this.marks);
		};
		
		focus.set(id, range);
		placeHolder.hide();
		onKeyDown(e, this.value);
	};
	
	onKeyUp (e: any) {
		e.persist();
		
		const { blockStore, onKeyUp, id, rootId, content } = this.props;
		const range = this.getRange();
		const k = e.which;
		
		let value = this.getValue();
		let diff = value.length - this.value.length;
		
		if (diff != 0) {
			this.marks = Mark.move(this.marks, this.from, diff);
			this.from = null;
		};
		
		this.placeHolderCheck();
		onKeyUp(e, value);
		
		window.clearTimeout(this.timeoutKeyUp);
		this.timeoutKeyUp = window.setTimeout(() => { this.blockUpdateText(this.marks); }, 500);
	};
	
	blockUpdateText (newMarks: I.Mark[]) {
		const { blockStore, id, rootId, content } = this.props;
		
		let { text, marks } = content;
		let value = this.getValue();

		text = String(text || '');
		if ((value == text) && (JSON.stringify(marks) == JSON.stringify(newMarks))) {
			return;
		};
		
		C.BlockSetTextText(rootId, id, value, newMarks);
	};
	
	blockUpdateMarks (newMarks: I.Mark[]) {
		const { blockStore, id, rootId, content } = this.props;
		const { text } = content;
		
		C.BlockSetTextText(rootId, id, String(text || ''), newMarks);
	};
	
	onFocus (e: any) {
		const { onFocus } = this.props;
		
		this.placeHolderCheck();
		keyboard.setFocus(true);
		onFocus(e);
	};
	
	onBlur (e: any) {
		const { commonStore, onBlur, content } = this.props;
		const { marks } = content;
		const node = $(ReactDOM.findDOMNode(this));
		const placeHolder = node.find('.placeHolder');
		
		this.blockUpdateText(marks);
		placeHolder.hide();
		keyboard.setFocus(false);
		onBlur(e);
	};
	
	onPaste (e: any) {
		const { onPaste } = this.props;

		onPaste(e);
	};
	
	onToggle (e: any) {
		this.props.onToggle(e);
	};
	
	onCheck (e: any) {
		const { blockStore, id, rootId, content } = this.props;
		const { checked } = content;
		
		focus.clear();
		C.BlockSetTextChecked(rootId, id, !checked);
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
		const range = getRange(node.find('.value').get(0) as Element);
		
		return range ? { from: range.start, to: range.end } : { from: 0, to: 0 };
	};
	
};

export default BlockText;