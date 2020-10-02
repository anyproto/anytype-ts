import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MenuItemVertical } from 'ts/component';
import { I, C, Key, keyboard, Util, SmileUtil, DataUtil, Mark } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class MenuDataviewDate extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	n: number = 0;

	render () {
		const sections = this.getSections();

		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						return <MenuItemVertical key={i} {...action} onMouseEnter={(e: any) => { this.onOver(e, action); }} />;
					})}
				</div>
			</div>
		);

		return (
			<div className="items">
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.setActive(items[this.n]);
		this.props.position();
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
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		win.unbind('keydown.menu');
		node.find('.items').unbind('scroll.menu');
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { formatDate, formatTime } = data;

		let sections = [
			{ 
				id: 'date', name: 'Date format', children: [
					{ id: 'formatDate', name: formatDate, arrow: true }
				] 
			},
			{ 
				id: 'time', name: 'Time format', children: [
					{ id: 'formatTime', name: formatTime, arrow: true }
				] 
			},
		];

		sections = DataUtil.menuSectionsMap(sections);
		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id; });
		};
		this.props.setActiveItem(items[this.n], scroll);
	};

	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();

		const k = e.key.toLowerCase();
		keyboard.disableMouse(true);
		
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				e.preventDefault();
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, true);
				break;
				
			case Key.down:
				e.preventDefault();
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
				
			case Key.tab:
			case Key.enter:
				e.preventDefault();
				if (item) {
					this.onOver(e, item);
				};
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};

	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, relationId, view } = data;
		const relation = view.relations.find((it: I.ViewRelation) => { return it.id == relationId; });
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.id == relationId; });

		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};

		let options = [];
		switch (item.key) {
			case 'formatDate':
				options = [
					{ id: I.DateFormat.MonthAbbrBeforeDay, name: Util.date('M d Y', Util.time()) },
					{ id: I.DateFormat.MonthAbbrAfterDay, name: Util.date('d M Y', Util.time()) },
					{ id: I.DateFormat.Short, name: Util.date('n/j/Y', Util.time()) },
					{ id: I.DateFormat.ShortUS, name: Util.date('j/n/Y', Util.time()) },
					{ id: I.DateFormat.ISO, name: Util.date('Y-m-d', Util.time()) },
				];
				break;

			case 'formatTime':
				options = [
					{ id: I.TimeFormat.H12, name: '12 hour' },
					{ id: I.TimeFormat.H24, name: '24 hour' },
				];
				break;
		};

		commonStore.menuOpen('select', {
			element: '#item-' + item.id,
			offsetX: 208,
			offsetY: -38,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				value: relation.dateOptions[item.key],
				options: options,
				onSelect: (e: any, el: any) => {
					relation.options[item.key] = el.id;
					view.relations[idx] = relation;

					C.BlockSetDataviewView(rootId, blockId, view.id, { ...view });
				}
			}
		});
	};

};

export default MenuDataviewDate;