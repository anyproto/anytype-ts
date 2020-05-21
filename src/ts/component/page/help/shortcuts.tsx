import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { HeaderHelpIndex as Header } from 'ts/component';
import { I, Docs, Util } from 'ts/lib';

interface Props extends RouteComponentProps<any> {};

import Block from './item/block';

class PageHelpShortcuts extends React.Component<Props, {}> {

	render () {
		const path: any[] = [
			{ icon: '🔮', name: 'Help', contentId: 'index' },
			{ icon: '⌨️', name: 'Keyboard & Shortcuts', contentId: 'shortcuts' },
		];

		return (
			<div className="wrapper">
				<Header {...this.props} path={path} />

				<div className="editor">
					<div className="blocks">
						{Docs.Help.Shortcuts.map((item: any, i: number) => (
							<Block key={i} {...this.props} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};

};

export default PageHelpShortcuts;
