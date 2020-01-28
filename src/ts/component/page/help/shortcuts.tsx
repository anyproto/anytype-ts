import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { HeaderHelpIndex as Header } from 'ts/component';
import { I, Util } from 'ts/lib';

interface Props extends RouteComponentProps<any> {};

import Block from './item/block';

class PageHelpShortcuts extends React.Component<Props, {}> {

	render () {
		const path: any[] = [
			{ icon: ':keyboard:', name: 'Shortcuts', contentId: 'shortcuts' },
		];
		
		const blocks: any[] = [
			{ type: I.BlockType.Icon, icon: ':keyboard:' },
			{ type: I.BlockType.Text, style: I.TextStyle.Title, text: 'Shortcuts' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header3, text: 'Common' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: '<b>Cmd/Ctrl + N</b> - Create new page' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: '<b>Enter</b> - Create new block' },
		];
		
		return (
			<div className="wrapper">
				<Header {...this.props} path={path} />
			
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

export default PageHelpShortcuts;