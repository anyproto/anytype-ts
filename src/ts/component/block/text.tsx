import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, keyboard, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
import 'highlight.js/styles/github.css';

interface Props extends I.BlockText {
	rootId: string;
	commonStore?: any;
	blockStore?: any;
	editorStore?: any;
	dataset?: any;
	number: number;
	onToggle?(e: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onKeyDown?(e: any): void;
	onKeyUp?(e: any): void;
};

interface State {
	checked: boolean;
};

const { ipcRenderer } = window.require('electron');
const low = window.require('lowlight');
const rehype = require('rehype');
const Constant = require('json/constant.json');
const $ = require('jquery');

@inject('commonStore')
@inject('blockStore')
@inject('editorStore')
@observer
class BlockText extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	editorRef: any = null;
	state = {
		checked: false
	};
	range: any = null;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onCheck = this.onCheck.bind(this);
		this.onSelect = this.onSelect.bind(this);
	};

	render () {
		const { blockStore, editorStore, id, number, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		const { checked } = this.state;
		const { focused, range } = editorStore;
		
		if (!block) {
			return null;
		};
		
		const { fields, content } = block;
		const { text, marks, style, marker, toggleable, checkable } = content;
		const { lang } = fields;
		
		let markers: any[] = [];
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
				ref={(ref: any) => { this.editorRef = ref; }}
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
				{item.type && number ? <div className="txt">{number + '.'}</div> : <Icon />}
			</div>
		);
		
		let placeHolder = <span className="placeHolder">Type anything...</span>;
		let cn = [ 'flex' ];
		
		switch (style) {
			default:
			case I.TextStyle.Paragraph:
				cn.push('p');
				break;
				
			case I.TextStyle.Title:
				cn.push('title');
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
				break;
		};
		
		return (
			<div className={cn.join(' ')}>
				<div className="markers">
					{markers.map((item: any, i: number) => (
						<Marker key={i} {...item} />
					))}
				</div>
				<div className="wrap">
					{placeHolder}
					{editor}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		
		if (!block) {
			return;
		};
		
		const { content } = block;
		const { checked } = content;
		
		this.setState({ checked: checked });
		this.setValue();
	};
	
	componentDidUpdate () {
		const { editorStore } = this.props;
		const { focused, range } = editorStore;
		
		this.rangeApply(focused, range);
		this.setValue();
	};
	
	setValue () {
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		const { fields, content } = block;
		const { text, style, marks } = content;
		const { lang } = fields;
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		
		let html = '';
		if (style == I.TextStyle.Code) {
			let res = low.highlight(String(lang || 'js'), text);
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
	
	componentWillUnmount () {
		this._isMounted = false;
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
				attr = 'style="text-color:' + mark.param + '"';
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
		const { onKeyDown } = this.props;
		
		this.placeHolderCheck();
		onKeyDown(e);
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;
		
		this.placeHolderCheck();
		onKeyUp(e);
	};
	
	onFocus (e: any) {
		const { onFocus } = this.props;
		
		this.placeHolderCheck();
		this.rangeSave();
		keyboard.setFocus(true);
		onFocus(e);
	};
	
	onBlur (e: any) {
		const { onBlur, editorStore } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const placeHolder = node.find('.placeHolder');
		
		placeHolder.hide();
		keyboard.setFocus(false);
		onBlur(e);
		//editorStore.rangeClear();
	};
	
	onToggle (e: any) {
		this.props.onToggle(e);
	};
	
	onCheck (e: any) {
		this.setState({ checked: !this.state.checked });
	};
	
	onSelect (e: any) {
		const { commonStore, editorStore, id, content } = this.props;
		
		this.rangeSave();
		
		const { focused, range } = editorStore;
		
		if (range && range.to && (range.from != range.to)) {
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
				light: false,
				vertical: I.MenuDirection.Top,
				horizontal: I.MenuDirection.Left,
				onClose: () => {
				},
				data: {
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
	
	rangeSave () {
		if (!this._isMounted) {
			return;
		};
		
		const { id, editorStore } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('.value').get(0) as Element) || { start: 0, end: 0 };
		
		editorStore.rangeSave(id, { from: range.start, to: range.end });
	};
	
	rangeApply (focused: string, range: I.TextRange) {
		const { id } = this.props;
		if (!this._isMounted || !focused || (focused != id)) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		setRange(node.find('.value').get(0) as Element, { start: range.from, end: range.to });
	};
	
};

export default BlockText;