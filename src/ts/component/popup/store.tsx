import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, IconObject } from 'ts/component';
import { I } from 'ts/lib';
import { dbStore } from 'ts/store';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	tab: string;
	subTab: string;
};

const $ = require('jquery');
const raf = require('raf');
const Tabs = [
	{ 
		id: 'type', 'name': 'Types', children: [
			{ id: 'market', 'name': 'Marketplace' },
			{ id: 'library', 'name': 'Library' },
			{ id: 'archive', 'name': 'Archive' },
		] 
	},
	{ id: 'template', 'name': 'Templates', children: [] },
	{ id: 'relation', 'name': 'Relations', children: [] },
];

class PopupStore extends React.Component<Props, State> {

	state = {
		tab: 'type',
		subTab: '',
	};

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.resize = this.resize.bind(this);
	};
	
	render () {
		const { objectTypes } = dbStore;
		const { tab, subTab } = this.state;
		const tabItem = Tabs.find((it: any) => { return it.id == tab; });

		let content = null;
		switch (tab) {

			default:
			case 'type':
				const Type = (item: any) => (
					<div className="item isType">
						<IconObject size={64} object={{ ...item, layout: I.ObjectLayout.ObjectType }} />
						<div className="info">
							<div className="name">{item.name}</div>
							<div className="descr">An invoice, bill or tab is a commercial documents...</div>
							<div className="line" />
						</div>
						<Button className="blank c28" text="Add" />
					</div>
				);

				let subContent = null;
				switch (subTab) {

					default:
					case 'market':
						subContent = (
							<React.Fragment>
								{objectTypes.map((item: any, i: number) => (
									<Type key={i} {...item} />
								))}
							</React.Fragment>
						);
						break;

					case 'library':
						break;

					case 'archive':
						break;

				};

				content = (
					<React.Fragment>
						<div className="mid">
							<Title text="Type every object" />
							<Label text="Our beautifully-designed templates come with hundreds" />

							<Button text="Create a new type" className="orange" />
						</div>

						<div className="tabs">
							{tabItem.children.map((item: any, i: number) => (
								<div key={item.id} className={[ 'item', (item.id == subTab ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onSubTab(e, item); }}>
									{item.name}
								</div>
							))}
						</div>

						<div className="items">
							{subContent}
						</div>
					</React.Fragment>
				);
				break;

			case 'template':
				break;

			case 'relation':
				break;

		};

		return (
			<div className="wrapper">
				<div className="head">
					<div className="tabs">
						{Tabs.map((item: any, i: number) => (
							<div key={item.id} className={[ 'item', (item.id == tab ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onTab(e, item); }}>
								{item.name}
							</div>
						))}
					</div>
				</div>
				
				<div className="body">
					{content}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();

		this.onTab(null, Tabs[0]);
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.unbind('resize.store').on('resize.store', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('resize.store');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		raf(() => {
			const { getId, position } = this.props;
			const win = $(window);
			const obj = $(`#${getId()} #innerWrap`);
			const width = Math.min(1152, Math.max(960, win.width() - 128));
			const height = Math.max(648, win.height() - 128);

			obj.css({ width: width, height: height });
			position();
		});
	};

	onTab (e: any, item: any) {
		const tabItem = Tabs.find((it: any) => { return it.id == item.id; });
		this.setState({ tab: item.id, subTab: tabItem.children[0].id });
	};

	onSubTab (e: any, item: any) {
		this.setState({ subTab: item.id });
	};
	
};

export default PopupStore;