import * as React from 'react';
import { Icon } from 'ts/component';
import { I, keyBoard } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockText {
	blockStore?: any;
};

@inject('blockStore')
@observer
class BlockText extends React.Component<Props, {}> {

	editorRef: any = null;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};

	render () {
		
		const { blockStore, header } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		
		if (!block) {
			return <div />;
		};
		
		const { content } = block;
		const { text, marks, style } = content;
		
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
		
		switch (style) {
			default:
			case I.TextStyle.p:
				editor = (
					<div className="p">{editor}</div>
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
			<div>
				{editor}
			</div>
		);
	};
	
	marksToHtml (text: string, marks: I.Mark[]) {
		let r = text.split('');
		let tag = [ 's', 'kbd', 'i', 'b', 'a' ];
		
		for (let mark of marks) {
			let range = mark.range;
			let t = tag[mark.type];
			
			if (r[range.from] && r[range.to - 1]) {
				r[range.from] = '<' + t + '>' + r[range.from];
				r[range.to - 1] += '</' + t + '>';
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
	
};

export default BlockText;