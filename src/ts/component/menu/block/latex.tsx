import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { I, S, U, J, keyboard, translate } from 'Lib';

const katex = require('katex');
require('katex/dist/contrib/mhchem');

const HEIGHT_SECTION = 28;
const HEIGHT_ITEM_BIG = 80;
const HEIGHT_ITEM_SMALL = 28;
const LIMIT = 40;

const MenuBlockLatex = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, getSize, position, close, setActive, onKeyDown } = props;
	const { data, className, classNameWrap } = param;
	const { onSelect, isTemplate } = data;
	const { filter } = S.Common;
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: isTemplate ? HEIGHT_ITEM_BIG : HEIGHT_ITEM_SMALL }));
	const n = useRef(-1);
	const emptyRef = useRef(0);
	const listRef = useRef(null);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onOver = (e: any, item: any) => {
		if (!item || isTemplate) {
			return;
		};

		S.Menu.open('previewLatex', {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width - (isTemplate ? 14 : 0),
			vertical: I.MenuDirection.Center,
			isSub: true,
			className,
			classNameWrap,
			data: {
				text: item.comment || item.symbol,
				example: item.comment ? true : false,
			}
		});
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item);
			onOver(e, item);
		};
	};

	const onClick = (e: any, item: any) => {
		e.stopPropagation();

		let from = filter.from;
		let to = filter.from;

		if (!isTemplate) {
			from--;
			to += filter.text.length;
		};

		onSelect(from, to, item);
		close();
	};

	const getSections = () => {
		const filter = U.String.regexEscape(S.Common.filter.text);

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

		if (filter) {
			sections = U.Menu.sectionsFilter(sections, filter);

			const regS = new RegExp(`/^${filter}/`, 'gi');

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
				s.children.sort((c1: any, c2: any) => U.Data.sortByWeight(c1, c2));
				return s;
			});
			sections.sort((c1: any, c2: any) => U.Data.sortByWeight(c1, c2));
		};

		return sections;
	};

	const getItems = () => {
		const sections = getSections();

		let items: any[] = [];
		for (const section of sections) {
			if (section.name) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};

		return items;
	};

	const getRowHeight = (item: any) => {
		if (item.isSection) {
			return HEIGHT_SECTION;
		};
		return isTemplate ? HEIGHT_ITEM_BIG : HEIGHT_ITEM_SMALL;
	};

	const resize = () => {
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

		obj.css({ height });
		position();
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
					id={`item-${item.id}`}
					className="item"
					style={param.style}
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
				>
					{isTemplate ? (
						<div className="inner">
							<div className="math" dangerouslySetInnerHTML={{ __html: U.String.sanitize(math) }} />
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

	const items = getItems();

	useEffect(() => {
		rebind();
		resize();
	}, []);

	useEffect(() => {
		const items = getItems();

		if (!items.length && !emptyRef.current) {
			emptyRef.current = filter.text.length;
		};

		if ((filter.text.length - emptyRef.current > 3) && !items.length) {
			close();
			return;
		};

		resize();
		rebind();
		position();
		setActive();
		onOver(null, items[n.current]);

		S.Menu.close('previewLatex');
	});

	useEffect(() => {
		n.current = 0;
	}, [ filter.text ]);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getListRef: () => listRef.current,
		onClick,
		onOver,
	}), []);

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
									ref={listRef}
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
					{translate('menuSelectEmpty')}
				</div>
			)}
		</div>
	);

}));

export default MenuBlockLatex;