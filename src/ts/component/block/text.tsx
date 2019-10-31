import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, keyBoard } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockText {
	blockStore?: any;
	number: number;
	toggled: boolean;
	onToggle (e: any): void;
};

interface State {
	checked: boolean;
};

@inject('blockStore')
@observer
class BlockText extends React.Component<Props, {}> {

	editorRef: any = null;
	state = {
		checked: false
	};

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onCheck = this.onCheck.bind(this);
	};

	render () {
		const { blockStore, header, number, toggled } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		const { checked } = this.state;
		
		if (!block) {
			return <div />;
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
				dangerouslySetInnerHTML={{ __html: html }}
			>
			</div>
		);
		
		let Marker = (item: any) => (
			<div className={[ 'marker', item.className, (item.active ? 'active' : '') ].join(' ')} onClick={item.onClick}>
				{item.type && number ? <div className="txt">{number}</div> : <Icon />}
			</div>
		);
		
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
					{editor}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
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
		keyBoard.keyDownBlock(e);
	};
	
	onKeyUp (e: any) {
		keyBoard.keyUpBlock(e);
	};
	
	onFocus (e: any) {
		keyBoard.setFocus(true);
	};
	
	onBlur (e: any) {
		keyBoard.setFocus(false);
	};
	
	onToggle (e: any) {
		this.props.onToggle(e);
	};
	
	onCheck (e: any) {
		this.setState({ checked: !this.state.checked });
	};
	
};

export default BlockText;