import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, Util } from 'ts/lib';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	page: string;
};

const $ = require('jquery');

class PopupShortcut extends React.Component<Props, State> {

	state = {
		page: 'main',
	};
	
	render () {
		const { page } = this.state;
		const platform = Util.getPlatform();
		const tabs = [
			{ id: 'main', name: 'Main' },
			{ id: 'navigation', name: 'Navigation' },
			{ id: 'markdown', name: 'Markdown' },
			{ id: 'command', name: 'Commands' },
		];
		const sections = this.getSections(page);

		const Tab = (item: any) => (
			<div className={[ 'item', (item.id == page ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onPage(item.id); }}>
				{item.name}
			</div>
		);

		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
			</div>
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
					{sections.map((item: any, i: number) => (
						<Section key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.props.position();
	};

	onPage (id: string) {
		this.setState({ page: id });
	};

	getSections (id: string) {
		const sections = {

			main: [
				{ 
					name: 'Basics', children: [

					]
				},
				{ 
					name: 'Structuring', children: [

					] 
				},
				{ 
					name: 'Selection', children: [

					]
				},
				{ 
					name: 'Actions', children: [

					]
				},
				{ 
					name: 'Text style', children: [

					]
				},
			]

		};

		return sections[id] || [];
	};

	resize () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('.body');

		body.css({ height: win.height() - 100 });
	};
	
};

export default PopupShortcut;