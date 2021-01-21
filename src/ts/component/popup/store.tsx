import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, IconObject } from 'ts/component';
import { I, DataUtil, Util } from 'ts/lib';
import { dbStore, blockStore } from 'ts/store';

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
		id: 'type', name: 'Types', active: 'library',
		children: [
			{ id: 'market', name: 'Marketplace', disabled: true },
			{ id: 'library', name: 'Library' },
		]
	},
	/*
	{ 
		id: 'template', 'name': 'Templates', active: 'library', 
		children: [
			{ id: 'market', name: 'Marketplace' },
			{ id: 'library', name: 'Library' },
		], 
	},
	*/
	{ 
		id: 'relation', 'name': 'Relations', active: 'library', 
		children: [
			{ id: 'market', name: 'Marketplace', disabled: true },
			{ id: 'library', name: 'Library' },
		], 
	},
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
		const { profile } = blockStore;
		const { tab, subTab } = this.state;
		const tabItem = Tabs.find((it: any) => { return it.id == tab; });
		const details = blockStore.getDetails(profile, profile);
		
		let relations = [];
		objectTypes.map((it: I.ObjectType) => {
			relations = relations.concat(it.relations);
		});
		relations = Util.arrayUniqueObjects(relations, 'relationKey');
		relations.sort((c1: any, c2: any) => {
			if (c1.name > c2.name) return 1;
			if (c1.name < c2.name) return -1;
			return 0;
		});

		let content = null;
		let subContent = null;
		let Item = null;

		switch (tab) {

			default:
			case 'type':
				Item = (item: any) => (
					<div className={[ 'item', 'isType', subTab ].join(' ')} onClick={(e: any) => { this.onObjectType(e, item); }}>
						<IconObject size={64} object={{ ...item, layout: I.ObjectLayout.ObjectType }} />
						<div className="info">
							<div className="name">{item.name}</div>
							<div className="descr">An invoice, bill or tab is a commercial documents... An invoice, bill or tab is a commercial documents... An invoice, bill or tab is a commercial documents...</div>
							<div className="author">
								<IconObject object={details} size={16} />
								{details.name}
							</div>
							<div className="line" />
						</div>
						<Button className="blank c28" text="Add" />
					</div>
				);

				switch (subTab) {

					default:
					case 'market':
						break;

					case 'library':
						subContent = (
							<React.Fragment>
								{objectTypes.map((item: any, i: number) => (
									<Item key={i} {...item} />
								))}
							</React.Fragment>
						);
						break;

				};

				content = (
					<React.Fragment>
						<div className="mid">
							<Title text="Type every object" />
							<Label text="Our beautifully-designed templates come with hundreds" />

							<Button text="Create a new type" className="orange" onClick={(e: any) => { this.onObjectType(e, { id: 'create' }); }} />
						</div>

						<div className="tabs">
							{tabItem.children.map((item: any, i: number) => (
								<div key={item.id} className={[ 'item', (item.id == subTab ? 'active' : ''), (item.disabled ? 'disabled' : '') ].join(' ')} onClick={(e: any) => { this.onSubTab(e, item); }}>
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
				Item = (item: any) => (
					<div className={[ 'item', 'isRelation', subTab ].join(' ')} onClick={(e: any) => { this.onRelation(e, item); }}>
						<div className="iconObject c48 isRelation">
							<div className={[ 'iconCommon', 'c30', 'icon', 'relation', DataUtil.relationClass(item.format) ].join(' ')} />
						</div>
						<div className="info">
							<div className="name">{item.name} ({item.relationKey})</div>
							<div className="author">
								<IconObject object={details} size={16} />
								{details.name}
							</div>
							<div className="line" />
						</div>
						<Button className="blank c28" text="Add" />
					</div>
				);

				switch (subTab) {

					default:
					case 'market':
						break;

					case 'library':
						subContent = (
							<React.Fragment>
								{relations.map((item: any, i: number) => (
									<Item key={i} {...item} />
								))}
							</React.Fragment>
						);
						break;

				};

				content = (
					<React.Fragment>
						<div className="mid">
							<Title text="All objects are connected" />
							<Label text="Our beautifully-designed templates come with hundreds" />

							<Button text="Create a new type" className="orange" />
						</div>

						<div className="tabs">
							{tabItem.children.map((item: any, i: number) => (
								<div key={item.id} className={[ 'item', (item.id == subTab ? 'active' : ''), (item.disabled ? 'disabled' : '') ].join(' ')} onClick={(e: any) => { this.onSubTab(e, item); }}>
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

		};

		return (
			<div className={[ 'wrapper', tab ].join(' ')}>
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
			const width = 1152; //Math.min(1152, Math.max(960, win.width() - 128));
			const height = Math.max(648, win.height() - 128);

			obj.css({ width: width, height: height });
			position();
		});
	};

	onTab (e: any, item: any) {
		const tabItem = Tabs.find((it: any) => { return it.id == item.id; });
		this.setState({ tab: item.id, subTab: tabItem.active });
	};

	onSubTab (e: any, item: any) {
		if (!item.disabled) {
			this.setState({ subTab: item.id });
		};
	};

	onObjectType (e: any, item: any) {
		const { history } = this.props;
		const id = DataUtil.schemaField(item.url);

		history.push('/main/objectType/' + id);
	};

	onRelation (e: any, item: any) {
		const { history } = this.props;

		history.push('/main/relation/' + item.id);
	};
	
};

export default PopupStore;