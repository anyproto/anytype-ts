import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I } from 'ts/lib';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

const $ = require('jquery');

class PopupShortcut extends React.Component<Props, {}> {
	
	render () {
		const tabs = [
			{ id: 'main', name: 'Main' },
			{ id: 'navigation', name: 'Navigation' },
			{ id: 'markdown', name: 'Markdown' },
			{ id: 'command', name: 'Commands' },
		];

		const Tab = (item: any) => (
			<div className="item">{item.name}</div>
		);

		return (
			<div className="wrapper">
				<div className="head">
					<div className="tabs">
						{tabs.map((item: any, i: number) => (
							<Tab key={i} {...item} />
						))}
					</div>
				</div>

				<div className="body">
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.props.position();
	};

	resize () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const head = node.find('.head');
		const body = node.find('.body');
		const height = win.height() - 100;

		console.log(win.height(), head.outerHeight());

		body.css({ height: height });
	};
	
};

export default PopupShortcut;