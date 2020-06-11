import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { HeaderHelpIndex as Header } from 'ts/component';
import { I, Docs } from 'ts/lib';
import { commonStore } from 'ts/store';

import Block from './item/block';

interface Props extends RouteComponentProps<any> {};

const $ = require('jquery');

class PageHelpIndex extends React.Component<Props, {}> {

	render () {
		const path: any[] = [
			{ icon: '🔮', name: 'Help', contentId: 'index' }
		];

		return (
			<div className="wrapper">
				<Header {...this.props} path={path} />

				<div className="editor">
					<div className="blocks">
						{Docs.Help.Index.map((item: any, i: number) => (
							<Block key={i} {...this.props} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const node = $(ReactDOM.findDOMNode(this));
		const btn = node.find('#button-menu-help');
		
		btn.unbind('click').on('click', (e: any) => { this.onHelp(); });
	};

	onHelp () {
		const node = $(ReactDOM.findDOMNode(this));
		const btn = node.find('#button-menu-help');

		commonStore.menuOpen('help', {
			type: I.MenuType.Vertical, 
			element: btn,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
		});
	};

};

export default PageHelpIndex;
