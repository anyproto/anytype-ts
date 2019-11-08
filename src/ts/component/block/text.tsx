import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, keyBoard } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';

interface Props extends I.BlockText {
	commonStore?: any;
	blockStore?: any;
	editorStore?: any;
	number: number;
	toggled: boolean;
	onToggle?(e: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onKeyDown?(e: any): void;
	onKeyUp?(e: any): void;
};

interface State {
	checked: boolean;
};

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
		const { blockStore, header, number, toggled } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		const { checked } = this.state;
		
		if (!block) {
			return null;
		};
		
		const { content } = block;
		const { text, marks, style, marker, toggleable, checkable } = content;
		
		let markers: any[] = [];
		if (marker) {
			markers.push({ type: marker, className: 'bullet c' + marker, active: false, onClick: () => {} });
		};
		if (toggleable) {
			markers.push({ type: 0, className: 'toggle', active: toggled, onClick: this.onToggle });
		};
		if (checkable) {
			markers.push({ type: 0, className: 'check', active: checked, onClick: this.onCheck });
		};
		
		let html = this.marksToHtml(text, marks);
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
				dangerouslySetInnerHTML={{ __html: html }}
			>
			</div>
		);
		
		let Marker = (item: any) => (
			<div className={[ 'marker', item.className, (item.active ? 'active' : '') ].join(' ')} onClick={item.onClick}>
				{item.type && number ? <div className="txt">{number}</div> : <Icon />}
			</div>
		);
		
		let placeHolder = <span className="placeHolder">Type anything...</span>;
		
		switch (style) {
			default:
			case I.TextStyle.p:
				editor = (
					<div className="p">{editor}</div>
				);
				break;
				
			case I.TextStyle.title:
				editor = (
					<div className="title">{editor}</div>
				);
				break;
				
			case I.TextStyle.h1:
				editor = (
					<div className="h1">{editor}</div>
				);
				break;
				
			case I.TextStyle.h2:
				editor = (
					<div className="h2">{editor}</div>
				);
				break;
				
			case I.TextStyle.h3:
				editor = (
					<div className="h3">{editor}</div>
				);
				break;
				
			case I.TextStyle.h4:
				editor = (
					<div className="h4">{editor}</div>
				);
				break;
				
			case I.TextStyle.quote:
				editor = (
					<div className="quote">{editor}</div>
				);
				break;
		};
		
		return (
			<div className="flex">
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
		
		const { blockStore, header } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		
		if (!block) {
			return;
		};
		
		const { content } = block;
		const { checked } = content;
		
		this.setState({ checked: checked });
	};
	
	componentDidUpdate () {
		this.rangeApply();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	marksToHtml (text: string, marks: I.Mark[]) {
		text = String(text || '');
		marks = marks || [];
		
		let r = text.split('');
		let tag = [ 's', 'kbd', 'i', 'b', 'a' ];
		
		for (let mark of marks) {
			let t = tag[mark.type];
			
			if (r[mark.range.from] && r[mark.range.to - 1]) {
				r[mark.range.from] = '<' + t + '>' + r[mark.range.from];
				r[mark.range.to - 1] += '</' + t + '>';
			};
		};
		return r.join('');
	};
	
	onKeyDown (e: any) {
		const { header, onKeyDown } = this.props;
		
		this.placeHolderCheck();
		onKeyDown(e);
	};
	
	onKeyUp (e: any) {
		const { header, onKeyUp } = this.props;
		
		this.placeHolderCheck();
		onKeyUp(e);
	};
	
	onFocus (e: any) {
		const { onFocus } = this.props;
		
		this.placeHolderCheck();
		this.rangeSave();
		keyBoard.setFocus(true);
		onFocus(e);
	};
	
	onBlur (e: any) {
		const { onBlur } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const placeHolder = node.find('.placeHolder');
		
		placeHolder.hide();
		keyBoard.setFocus(false);
		onBlur(e);
	};
	
	onToggle (e: any) {
		this.props.onToggle(e);
	};
	
	onCheck (e: any) {
		this.setState({ checked: !this.state.checked });
	};
	
	onSelect (e: any) {
		const { commonStore, editorStore, header } = this.props;
		
		this.rangeSave();
		
		const { range } = editorStore;
		
		if (range && (range.start != range.end)) {
			const node = $(ReactDOM.findDOMNode(this));
			const offset = node.offset();
			const rect = window.getSelection().getRangeAt(0).getBoundingClientRect() as DOMRect;
			
			const x = rect.x - offset.left + Constant.size.blockMenu - Constant.size.menuBlockAction / 2 + rect.width / 2;
			const y = rect.y - (offset.top - $(window).scrollTop()) - 4;
			
			commonStore.menuOpen('blockAction', { 
				element: 'block-' + header.id,
				type: I.MenuType.Horizontal,
				offsetX: x,
				offsetY: -y,
				light: false,
				vertical: I.MenuDirection.Top,
				horizontal: I.MenuDirection.Left
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
		
		const { header, editorStore } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		
		editorStore.rangeSave(header.id, getRange(node.find('.value').get(0) as Element));
	};
	
	rangeApply () {
		const { editorStore, header } = this.props;
		const { focused, range } = editorStore;
		
		if (!this._isMounted || (focused != header.id)) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));

		setRange(node.find('.value').get(0) as Element, range);
	};
	
};

export default BlockText;