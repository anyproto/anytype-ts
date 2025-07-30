import * as React from 'react';
import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { I, S, U, J, keyboard } from 'Lib';

const katex = require('katex');
require('katex/dist/contrib/mhchem');

const HEIGHT_SECTION = 28;
const HEIGHT_ITEM_BIG = 80;
const HEIGHT_ITEM_SMALL = 28;
const LIMIT = 40;

const MenuBlockLatex = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, onKeyDown, setActive, close, getId, getSize, position } = props;
	const { data } = param;
	const { isTemplate } = data;

	const emptyLength = useRef(0);
	const refList = useRef<any>(null);
	const cache = useRef<any>(null);
	const n = useRef(-1);
	const filterPrevious = useRef('');

	const rebind = useCallback(() => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	}, [ onKeyDown, setActive ]);
	
	const unbind = useCallback(() => {
		$(window).off('keydown.menu');
	}, []);

	const getSections = useCallback(() => {
		const filterText = U.Common.regexEscape(S.Common.filter.text);

		let sections = U.Menu.sectionsMap(J.Latex);
		sections = sections.filter(it => (it.id == 'templates') == isTemplate);

		sections = sections.map((it: any) => {
			it.children = it.children.map((c: any) => {
				c.name = String(c.name || c.symbol || '');
				c.comment = String(c.comment || '').replace(/`/g, '');
				return c;
			});
			return it;
		});

		if (filterText) {
			sections = U.Menu.sectionsFilter(sections, filterText);

			const regS = new RegExp('/^' + filterText + '/', 'gi');

			sections = sections.map((s: any) => {
				s._sortWeight_ = 0;
				s.children = s.children.map((c: any) => {
					const n = c.name.replace(/\\\\/g, '');
					let w = 0;
					if (n === filterText) {
						w = 10000;
					} else
					if (n.match(regS)) {
						w = 1000;
					};
					c._sortWeight_ = w;
					s._sortWeight_ += w;
					return c;
				});
				s.children.sort((c1: any, c2: any) => U.Data.sortByWeight(c1, c2));
				return s;
			});
			sections.sort((c1: any, c2: any) => U.Data.sortByWeight(c1, c2));
		};

		return sections;
	}, [ isTemplate ]);

	const getItems = useCallback((withSections: boolean) => {
		const sections = getSections();

		let items: any[] = [];
		for (const section of sections) {
			if (withSections) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};

		return items;
	}, [ getSections ]);

	const getRowHeight = useCallback((item: any) => {
		if (item.isSection) {
			return HEIGHT_SECTION;
		};
		return isTemplate ? HEIGHT_ITEM_BIG : HEIGHT_ITEM_SMALL;
	}, [ isTemplate ]);

	const onOver = useCallback((e: any, item: any) => {
		if (!item) {
			return;
		};

		if (isTemplate) {
			return;
		};

		S.Menu.open('previewLatex', {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width - (isTemplate ? 14 : 0),
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				text: item.comment || item.symbol,
				example: item.comment ? true : false,
			}
		});
	}, [ getId, getSize, isTemplate ]);

	const onMouseEnter = useCallback((e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item);
			onOver(e, item);
		};
	}, [ setActive, onOver ]);

	const onClick = useCallback((e: any, item: any) => {
		e.stopPropagation();

		const { filter } = S.Common;
		const { onSelect } = data;

		let from = filter.from;
		let to = filter.from;

		if (!isTemplate) {
			from--;
			to += filter.text.length;
		};

		onSelect(from, to, item);
		close();
	}, [ data, close, isTemplate ]);

	const resize = useCallback(() => {
		const items = getItems(true);
		const obj = $(`#${getId()} .content`);
		const offset = 16;
		const ih = isTemplate ? HEIGHT_ITEM_BIG : HEIGHT_ITEM_SMALL;

		let height = offset;

		for (const item of items) {
			height += getRowHeight(item);
		};

		height = Math.max(ih + offset, Math.min(ih * 10, height));

		if (!items.length) {
			height = 44;
		};

		obj.css({ height: height });
		position();
	}, [ getId, position, isTemplate, getItems, getRowHeight ]);

	useEffect(() => {
		const items = getItems(true);

		rebind();
		resize();

		cache.current = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: (isTemplate ? HEIGHT_ITEM_BIG : HEIGHT_ITEM_SMALL),
			keyMapper: i => (items[i] || {}).id,
		});

		return () => unbind();
	}, [ rebind, unbind, resize, getItems, isTemplate ]);

	useEffect(() => {
		const { filter } = S.Common;
		const items = getItems(false);

		if (filter.text != filterPrevious.current) {
			n.current = 0;
			filterPrevious.current = filter.text;
		};

		if (!items.length && !emptyLength.current) {
			emptyLength.current = filter.text.length;
		};

		if ((filter.text.length - emptyLength.current > 3) && !items.length) {
			close();
			return;
		};

		resize();
		rebind();
		position();
		setActive();
		onOver(null, items[n.current]);

		S.Menu.close('previewLatex');
	}, [ S.Common.filter.text, close, resize, rebind, position, setActive, onOver, getItems ]);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getSections,
		getItems: () => getItems(false),
		getRowHeight,
		resize,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		onOver,
	}), [ rebind, unbind, getSections, getItems, getRowHeight, resize, onClick, onOver ]);

	const { filter } = S.Common;
	const items = getItems(true);

	if (!cache.current) {
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
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
				>
					{isTemplate ? (
						<div className="inner">
							<div className="math" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(math) }} />
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
				cache={cache.current}
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
									ref={ref => refList.current = ref}
									width={width}
									height={height}
									deferredMeasurmentCache={cache.current}
									rowCount={items.length}
									rowHeight={({ index }) => getRowHeight(items[index])}
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

}));

export default MenuBlockLatex;
