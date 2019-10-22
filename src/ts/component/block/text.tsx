import * as React from 'react';
import { Icon } from 'ts/component';
import { I, keyBoard } from 'ts/lib';

import ViewGrid from './dataView/view/grid';

interface Props extends I.BlockText {};

class BlockText extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};

	render () {
		const { header, content } = this.props;
		const { text, style } = content;
		
		let Content = (
			<div 
			contentEditable 
			suppressContentEditableWarning
			onFocus={this.onFocus}
			onBlur={this.onBlur}
			>
				{text}
			</div>
		);
		let cn = '';
		
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
	
	onFocus (e: any) {
		keyBoard.setFocus(true);
	};
	
	onBlur (e: any) {
		keyBoard.setFocus(false);
	};
	
};

export default BlockText;