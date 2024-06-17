import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { I, keyboard, UtilData, UtilMenu, UtilCommon } from 'Lib';
import { commonStore, menuStore } from 'Store';
const Sections = require('json/latex.json');

const katex = require('katex');
require('katex/dist/contrib/mhchem');

const HEIGHT_SECTION = 28;
const HEIGHT_ITEM_BIG = 80;
const HEIGHT_ITEM_SMALL = 28;
const LIMIT = 40;

const MenuBlockLatex = observer(class MenuBlockLatex extends React.Component<I.Menu> {

	_isMounted = false;
	emptyLength = 0;
	refList: any = null;
	cache: any = {};
	n = -1;
	filter = '';

	constructor (props: I.Menu) {
		super(props);

		this.rebind = this.rebind.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { isTemplate } = data;
		const { filter } = commonStore;
		const items = this.getItems(true);

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			let content = null;
			if (item.isSection) {
				content = (<div className="sectionName" style={param.style}>{item.name}</div>);
			} else {
				const name = String(item.name || '').replace(/\\\\/g, '\\');

				const math = katex.renderToString(item.comment || item.symbol, {
					displayMode: true,
					throwOnError: false,
					output: 'html',
					fleqn: false,
					trust: (context: any) => [ '\\url', '\\href', '\\includegraphics' ].includes(context.command),
				});

				content = (
					<div
						id={'item-' + item.id}
						className="item"
						style={param.style}
						onMouseEnter={e => this.onMouseEnter(e, item)}
						onClick={e => this.onClick(e, item)}
					>
						{isTemplate ? (
							<div className="inner">
								<div className="math" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(math) }} />
							</div>
						) : (
							<div className="name">{name}</div>
						)}
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
						isRowLoaded={() => true}
						threshold={LIMIT}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={ref => this.refList = ref}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={({ index }) => this.getRowHeight(items[index])}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
										scrollToAlignment="center"
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
		const { param } = this.props;
		const { data } = param;
		const { isTemplate } = data;
		const items = this.getItems(true);

		this._isMounted = true;
		this.rebind();
		this.resize();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: (isTemplate ? HEIGHT_ITEM_BIG : HEIGHT_ITEM_SMALL),
			keyMapper: i => (items[i] || {}).id,
		});

		this.forceUpdate();
	};

	componentDidUpdate () {
		const { filter } = commonStore;
		const items = this.getItems(false);

		if (filter.text != this.filter) {
			this.n = 0;
			this.filter = filter.text;
		};

		if (!items.length && !this.emptyLength) {
			this.emptyLength = filter.text.length;
		};

		if ((filter.text.length - this.emptyLength > 3) && !items.length) {
			this.props.close();
			return;
		};

		this.resize();
		this.rebind();
		this.props.position();
		this.props.setActive();
		this.onOver(null, items[this.n]);

		menuStore.close('previewLatex');
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	onOver (e: any, item: any) {
		if (!item) {
			return;
		};

		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { isTemplate } = data;

		if (isTemplate) {
			return;
		};

		menuStore.open('previewLatex', {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width - (isTemplate ? 14 : 0),
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				text: item.comment || item.symbol,
				example: item.comment ? true : false,
			}
		});
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item);
			this.onOver(e, item);
		};
	};

	onClick (e: any, item: any) {
		e.stopPropagation();

		const { filter } = commonStore;
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect, isTemplate } = data;

		let from = filter.from;
		let to = filter.from;

		if (!isTemplate) {
			from--;
			to += filter.text.length;
		};

		onSelect(from, to, item);
		close();
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { isTemplate } = data;
		const filter = UtilCommon.regexEscape(commonStore.filter.text);

		let sections = UtilMenu.sectionsMap(Sections);
		sections = sections.filter(it => (it.id == 'templates') == isTemplate);

		sections = sections.map((it: any) => {
			it.children = it.children.map((c: any) => {
				c.name = String(c.name || c.symbol || '');
				c.comment = String(c.comment || '').replace(/`/g, '');
				return c;
			});
			return it;
		});

		if (filter) {
			sections = UtilMenu.sectionsFilter(sections, filter);

			const regS = new RegExp('/^' + filter + '/', 'gi');

			sections = sections.map((s: any) => {
				s._sortWeight_ = 0;
				s.children = s.children.map((c: any) => {
					const n = c.name.replace(/\\/g, '');
					let w = 0;
					if (n === filter) {
						w = 10000;
					} else
					if (n.match(regS)) {
						w = 1000;
					};
					c._sortWeight_ = w;
					s._sortWeight_ += w;
					return c;
				});
				s.children.sort((c1: any, c2: any) => UtilData.sortByWeight(c1, c2));
				return s;
			});
			sections.sort((c1: any, c2: any) => UtilData.sortByWeight(c1, c2));
		};

		return sections;
	};

	getItems (withSections: boolean) {
		const sections = this.getSections();

		let items: any[] = [];
		for (const section of sections) {
			if (withSections) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};

		return items;
	};

	getRowHeight (item: any) {
		const { param } = this.props;
		const { data } = param;
		const { isTemplate } = data;

		if (item.isSection) {
			return HEIGHT_SECTION;
		};
		return isTemplate ? HEIGHT_ITEM_BIG : HEIGHT_ITEM_SMALL;
	};

	recalcIndex () {
		const itemsWithSection = this.getItems(true);
		const itemsWithoutSection = itemsWithSection.filter(it => !it.isSection);
		const active: any = itemsWithoutSection[this.n] || {};

		return itemsWithSection.findIndex(it => it.id == active.id);
	};

	resize () {
		const { param, getId, position } = this.props;
		const { data } = param;
		const { isTemplate } = data;
		const items = this.getItems(true);
		const obj = $(`#${getId()} .content`);
		const offset = 16;
		const ih = isTemplate ? HEIGHT_ITEM_BIG : HEIGHT_ITEM_SMALL;

		let height = offset;

		for (const item of items) {
			height += this.getRowHeight(item);
		};

		height = Math.max(ih + offset, Math.min(ih * 10, height));

		if (!items.length) {
			height = 44;
		};

		obj.css({ height: height });
		position();
	};

});

export default MenuBlockLatex;
