import * as React from 'react';
import { Icon } from 'ts/component';
import { I, keyBoard } from 'ts/lib';

interface Props extends I.BlockText {};

class BlockText extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};

	render () {
		const { header, content } = this.props;
		const { text, style } = content;
		
		let html = this.marksToHtml();
		let Content = (
			<div 
			contentEditable 
			suppressContentEditableWarning
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
				Content = (
					<div className="p">{Content}</div>
				);
				break;
				
			case I.TextStyle.h1:
				Content = (
					<div className="h1">{Content}</div>
				);
				break;
				
			case I.TextStyle.h2:
				Content = (
					<div className="h2">{Content}</div>
				);
				break;
				
			case I.TextStyle.h3:
				Content = (
					<div className="h3">{Content}</div>
				);
				break;
				
			case I.TextStyle.h4:
				Content = (
					<div className="h4">{Content}</div>
				);
				break;
				
			case I.TextStyle.quote:
				Content = (
					<div className="quote">{Content}</div>
				);
				break;
		};
		
		return (
			<div>
				{Content}
			</div>
		);
	};
	
	marksToHtml () {
		const { content } = this.props;
		const { text, marks, style } = content;
		
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