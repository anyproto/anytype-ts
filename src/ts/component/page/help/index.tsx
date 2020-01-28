import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { HeaderHelpIndex as Header } from 'ts/component';
import { I, Util } from 'ts/lib';

interface Props extends RouteComponentProps<any> {};

import Block from './item/block';

class PageHelpIndex extends React.Component<Props, {}> {
	
	render () {
		const blocks: any[] = [
			{ type: I.BlockType.Icon, icon: ':question:' },
			{ type: I.BlockType.Text, style: I.TextStyle.Title, text: 'Help: Table of contents' },
			{ type: I.BlockType.Link, icon: ':keyboard:', name: 'Shortcuts', contentId: 'shortcuts' },
		];
		
		return (
			<div className="wrapper">
				<Header {...this.props} />
			
				<div className="editor">
					<div className="blocks">
						{blocks.map((item: any, i: number) => (
							<Block key={i} {...this.props} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};
	
};

export default PageHelpIndex;