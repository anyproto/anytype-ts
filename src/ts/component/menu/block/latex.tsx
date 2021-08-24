import * as React from 'react';
import { I, keyboard } from 'ts/lib';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { observer } from 'mobx-react';
import { BlockMath } from 'react-katex';

interface Props extends I.Menu {}

const sections = require('json/latex.json');
const $ = require('jquery');
const HEIGHT_SECTION = 28;
const HEIGHT_ITEM = 48;
const LIMIT = 40;

const MenuBlockLatex = observer(class MenuBlockLatex extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	refFilter: any = null;
	refList: any = null;
	cache: any = {};
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
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
				content = (
					<div id={'item-' + item.id} className="item" style={param.style}>
						<div className="math">
							<BlockMath math={item.symbol} />
						</div>
						<div className="name">
							{item.symbol}
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

	onClick (e: any, item: any) {
		e.stopPropagation();
	};

	getItems (withSections: boolean) {
		let items: any[] = [];
		for (let section of sections) {
			if (withSections) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};
		for (let i = 0; i < items.length; i++) {
			items[i].id = i;
		};
		return items;
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems(true);
		const obj = $(`#${getId()} .content`);
		const offset = 16;
		const height = Math.max(HEIGHT_ITEM + offset, Math.min(280, items.length * HEIGHT_ITEM + offset));

		obj.css({ height: height });
		position();
	};
	
});

export default MenuBlockLatex;