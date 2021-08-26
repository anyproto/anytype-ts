import * as React from 'react';
import { I, keyboard, DataUtil } from 'ts/lib';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { observer } from 'mobx-react';
import { BlockMath } from 'react-katex';
import { commonStore } from 'ts/store';

import 'react-virtualized/styles.css';

interface Props extends I.Menu {}

const Sections = require('json/latex.json');
const $ = require('jquery');
const HEIGHT_SECTION = 28;
const HEIGHT_ITEM = 56;
const LIMIT = 40;

const MenuBlockLatex = observer(class MenuBlockLatex extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	refFilter: any = null;
	refList: any = null;
	cache: any = {};
	n: number = 0;
	filter: string = '';
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = commonStore;
		const items = this.getItems(true);

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const symbol = String(item.name || '').replace(/\\\\/g, '\\');
			
			let content = null;
			if (item.isSection) {
				content = (<div className="sectionName" style={param.style}>{item.name}</div>);
			} else {
				content = (
					<div id={'item-' + item.id} className="item withDescription" style={param.style} onMouseEnter={(e: any) => { this.onMouseEnter(e, item) }}>
						<div className="math">
							<BlockMath math={item.name} />
						</div>
						<div className="info">
							<div className="txt">
								<div className="name">{symbol}</div>
							</div>
						</div>
					</div>
				);
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className="items">
				{items.length ? (
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={() => { return true; }}
						threshold={LIMIT}
					>
						{({ onRowsRendered, registerChild }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={(ref: any) => { this.refList = ref; }}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={({ index }) => {
											const item = items[index];
											return item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
										}}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				) : (
					<div className="item empty">
						No options available
					</div>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		const items = this.getItems(true);

		this._isMounted = true;
		this.rebind();
		this.resize();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.forceUpdate();
	};

	componentDidUpdate () {
		const { filter } = commonStore;

		if (filter.text != this.filter) {
			this.n = 0;
			this.filter = filter.text;
		};

		this.props.setActive();
		this.props.position();
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};

	unbind () {
		$(window).unbind('keydown.menu');
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item);
			this.onOver(e, item);
		};
	};

	onClick (e: any, item: any) {
		e.stopPropagation();
	};

	getSections () {
		const { filter } = commonStore;

		let sections = DataUtil.menuSectionsMap(Sections).map((it: any) => {
			it.children = it.children.map((c: any) => {
				c.name = c.symbol;
				delete(c.symbol);
				return c;
			});
			return it;
		});

		if (filter.text) {
			sections = DataUtil.menuSectionsFilter(sections, filter.text);
		};
		return sections;
	};

	getItems (withSections: boolean) {
		const sections = this.getSections();

		let items: any[] = [];
		for (let section of sections) {
			if (withSections) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};

		return items;
	};

	recalcIndex () {
		const itemsWithSection = this.getItems(true);
		const itemsWithoutSection = itemsWithSection.filter((it: any) => { return !it.isSection; });
		const active: any = itemsWithoutSection[this.n] || {};

		return itemsWithSection.findIndex((it: any) => { return it.id == active.id; });
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems(true);
		const obj = $(`#${getId()} .content`);
		const offset = 16;
		
		let height = Math.max(HEIGHT_ITEM + offset, Math.min(280, items.length * HEIGHT_ITEM + offset));

		if (!items.length) {
			height = 44;
		};

		obj.css({ height: height });
		position();
	};
	
});

export default MenuBlockLatex;