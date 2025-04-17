import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Pager, ObjectName, Cell, SelectionTarget, Icon } from 'Component';
import { I, C, S, U, J, Relation, translate, keyboard, analytics } from 'Lib';

interface Column {
	relationKey: string;
	name: string;
	className?: string;
	isObject?: boolean;
	isCell?: boolean;
	mapper?: (value : any) => any;
};

interface Props {
	spaceId: string;
	subId: string;
	rootId: string;
	columns: Column[];
	sources?: string[];
	filters?: I.Filter[];
	relationKeys?: string[];
	route: string;
};

interface ListObjectRefProps {
	getData: (page: number, callBack?: (message: any) => void) => void;
};

const PREFIX = 'listObject';

const ListObject = observer(forwardRef<ListObjectRefProps, Props>(({
	spaceId = '',
	subId = '',
	rootId = '',
	columns = [],
	sources = [],
	filters = [],
	relationKeys = [],
	route = '',
}, ref) => {

	const [ sortId, setSortId ] = useState('');
	const [ sortType, setSortType ] = useState(I.SortType.Asc);
	const { offset, total } = S.Record.getMeta(subId, '');
	const { dateFormat } = S.Common;

	const getColumns = (): Column[] => {
		return ([ { relationKey: 'name', name: translate('commonName'), isObject: true } ] as any[]).concat(columns || []);
	};

	const getKeys = () => {
		return J.Relation.default.concat(getColumns().map(it => it.relationKey)).concat(relationKeys || []);
	};

	const getItems = () => {
		return S.Record.getRecords(subId, getKeys());
	};

	const getData = (page: number, callBack?: (message: any) => void) => {
		const limit = J.Constant.limit.listObject;
		const offset = (page - 1) * limit;
		const fl = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(filters || []);

		S.Record.metaSet(subId, '', { offset });

		U.Data.searchSubscribe({
			spaceId,
			subId,
			sorts: [ { relationKey: sortId, type: sortType } ],
			keys: getKeys(),
			sources,
			filters: fl,
			offset,
			limit,
			ignoreHidden: true,
			ignoreDeleted: true,
		}, callBack);
	};

	const onContext = (e: any, id: string): void => {
		e.preventDefault();
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');

		let objectIds = selection?.get(I.SelectType.Record) || [];
		if (!objectIds.length) {
			objectIds = [ id ];
		};
		
		S.Menu.open('objectContext', {
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			data: {
				objectIds,
				subId,
				relationKeys: getKeys(),
				allowedLinkTo: true,
				allowedOpen: true,
			}
		});
	};

	const onSort = (relationKey: string): void => {
		let type = I.SortType.Asc;

		if (sortId == relationKey) {
			type = sortType == I.SortType.Asc ? I.SortType.Desc : I.SortType.Asc;
		};

		setSortId(relationKey);
		setSortType(type);

		analytics.event('ObjectListSort', { relationKey, route, type });
	};

	const columnList = getColumns();
	const items = getItems();

	let pager = null;
	if (total && items.length) {
		pager = (
			<Pager 
				offset={offset} 
				limit={J.Constant.limit.listObject} 
				total={total} 
				onChange={page => getData(page)} 
			/>
		);
	};

	const Row = (item: any) => {
		const cn = [ 'row' ];

		if (U.Object.isTaskLayout(item.layout) && item.isDone) {
			cn.push('isDone');
		};
		if (item.isArchived) {
			cn.push('isArchived');
		};
		if (item.isDeleted) {
			cn.push('isDeleted');
		};
		if (item.isHidden) {
			cn.push('isHidden');
		};

		return (
			<SelectionTarget 
				id={item.id} 
				type={I.SelectType.Record} 
				className={cn.join(' ')}
				onContextMenu={e => onContext(e, item.id)}
			>
				{columnList.map(column => {
					const cn = [ 'cell', `c-${column.relationKey}` ];
					const cnc = [ 'cellContent' ];
					const value = item[column.relationKey];

					if (column.className) {
						cnc.push(column.className);
					};

					let content = null;
					let onClick = null;

					if (column.isObject) {
						let object = null;

						if (column.relationKey == 'name') {
							object = item;

							cn.push('isName');
							cnc.push('isName');
						} else {
							object = S.Detail.get(subId, value, []);
						};

						if (!object._empty_) {
							onClick = () => U.Object.openConfig(object);
							content = (
								<div className="flex">
									<IconObject object={object} />
									<ObjectName object={object} />
								</div>
							);
						};
					} else 
					if (column.isCell) {
						content = (
							<Cell
								elementId={Relation.cellId(PREFIX, column.relationKey, item.id)}
								rootId={rootId}
								subId={subId}
								block={null}
								relationKey={column.relationKey}
								getRecord={() => item}
								viewType={I.ViewType.Grid}
								idPrefix={PREFIX}
								iconSize={20}
								readonly={true}
								arrayLimit={2}
								textLimit={150}
							/>
						);
					} else {
						content = column.mapper ? column.mapper(value) : value;
					};

					return (
						<div key={`cell-${column.relationKey}`} className={cn.join(' ')}>
							{content ? <div className={cnc.join(' ')} onClick={onClick}>{content}</div> : ''}
						</div>
					);
				})}
			</SelectionTarget>
		);
	};

	useEffect(() => {
		setSortId(columnList[0].relationKey);

		return () => {
			C.ObjectSearchUnsubscribe([ subId ]);
		}
	}, []);

	useEffect(() => getData(1), [ sortId, sortType ]);

	useImperativeHandle(ref, () => ({
		getData,
	}));	

	return (
		<div className="listObject">
			<div className="table">
				<div className="row isHead">
					{columnList.map(column => {
						let arrow = null;

						if (sortId == column.relationKey) {
							arrow = <Icon className={`sortArrow c${sortType}`} />;
						};

						return (
							<div key={`head-${column.relationKey}`} className="cell isHead" onClick={() => onSort(column.relationKey)}>
								<div className="name">{column.name}{arrow}</div>
							</div>
						);
					})}
				</div>

				{!items.length ? (
					<div className="row">
						<div className="cell empty">{translate('commonNoObjects')}</div>
					</div>
				) : (
					<>
						{items.map((item: any, i: number) => (
							<Row key={i} {...item} />
						))}
					</>
				)}
			</div>
			
			{pager}
		</div>
	);

}));

export default ListObject;