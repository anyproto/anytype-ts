import * as React from 'react';
import { observer } from 'mobx-react';
import { I, C, UtilData, UtilFile, Relation, UtilObject, translate, keyboard, UtilCommon } from 'Lib';
import { IconObject, Pager, ObjectName, Cell } from 'Component';
import { detailStore, dbStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Column {
	relationKey: string;
	name: string;
	className?: string;
	isObject?: boolean;
	isCell?: boolean;
	mapper?: (value : any) => any;
};

interface Props {
	subId: string;
	rootId: string;
	columns: Column[];
	sources?: string[];
	filters?: I.Filter[];
	dataset?: any;
};

const PREFIX = 'listObject';
const LIMIT = 50;

const ListObject = observer(class ListObject extends React.Component<Props> {

	public static defaultProps: Props = {
		subId: '',
		rootId: '',
		columns: [],
		sources: [],
		filters: [],
	};

	render () {
		const { subId, rootId, columns } = this.props;
		const items = this.getItems();
		const { offset, total } = dbStore.getMeta(subId, '');
		const length = columns.length;
		const width = 70 / length;

		let pager = null;
		if (total && items.length) {
			pager = (
				<Pager 
					offset={offset} 
					limit={LIMIT} 
					total={total} 
					onChange={page => this.getData(page)} 
				/>
			);
		};

		const Row = (item: any) => {
			const cn = [ 'row', 'selectable', `type-${I.SelectType.Record}` ];

			if ((item.layout == I.ObjectLayout.Task) && item.isDone) {
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
				<tr 
					id={`selectable-${item.id}`} 
					className={cn.join(' ')} 
					onContextMenu={e => this.onContext(e, item.id)}
					{...UtilCommon.dataProps({ id: item.id, type: I.SelectType.Record })}
				>
					<td className="cell isName">
						<div className="cellContent isName" onClick={() => UtilObject.openPopup(item)}>
							<div className="flex">
								<IconObject object={item} />
								<ObjectName object={item} />
							</div>
						</div>
					</td>

					{columns.map(column => {
						const cnc = [ 'cellContent' ];
						const value = item[column.relationKey];

						if (column.className) {
							cnc.push(column.className);
						};

						let content = null;
						let onClick = null;

						if (value) {
							if (column.isObject) {
								const object = detailStore.get(subId, value, []);
								if (!object._empty_) {
									let { name } = object;

									if (UtilObject.isFileLayout(object.layout)) {
										name = UtilFile.name(object);
									};

									onClick = () => UtilObject.openPopup(object);
									content = (
										<div className="flex">
											<IconObject object={object} />
											<ObjectName object={{ ...object, name }} />
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
										record={item}
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
						};

						return (
							<td key={`cell-${column.relationKey}`} className="cell" style={{ width: `${width}%` }}>
								{content ? <div className={cnc.join(' ')} onClick={onClick}>{content}</div> : ''}
							</td>
						);
					})}
				</tr>
			);
		};

		return (
			<div className="listObject">
				<table>
					<thead>
						<tr className="row">
							<th className="cellHead">
								<div className="name">{translate('commonName')}</div>
							</th>
							{columns.map(column => (
								<th key={`head-${column.relationKey}`} className="cellHead">
									<div className="name">{column.name}</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{!items.length ? (
							<tr>
								<td className="cell empty" colSpan={3}>{translate('commonNoObjects')}</td>
							</tr>
						) : (
							<React.Fragment>
								{items.map((item: any, i: number) => (
									<Row key={i} {...item} />
								))}
							</React.Fragment>
						)}
					</tbody>
				</table>
				
				{pager}
			</div>
		);
	};

	componentDidMount () {
		this.getData(1);
	};

	componentWillUnmount(): void {
		C.ObjectSearchUnsubscribe([ this.props.subId ]);
	};

	getItems () {
		const { subId } = this.props;
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, this.getKeys()));
	};

	getKeys () {
		return Constant.defaultRelationKeys.concat(this.props.columns.map(it => it.relationKey));
	};

	getData (page: number, callBack?: (message: any) => void) {
		const { subId, sources, filters } = this.props;
		const offset = (page - 1) * LIMIT;

		dbStore.metaSet(subId, '', { offset });

		UtilData.searchSubscribe({
			subId,
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc }
			],
			keys: this.getKeys(),
			sources,
			filters,
			offset,
			limit: LIMIT,
			ignoreHidden: true,
			ignoreDeleted: true,
			ignoreWorkspace: true,
		}, callBack);
	};

	onContext (e: any, id: string): void {
		e.preventDefault();
		e.stopPropagation();

		const { subId } = this.props;
		const { dataset } = this.props;
		const { selection } = dataset || {};

		let objectIds = selection ? selection.get(I.SelectType.Record) : [];
		if (!objectIds.length) {
			objectIds = [ id ];
		};
		
		menuStore.open('dataviewContext', {
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			data: {
				objectIds,
				subId,
				allowedLink: true,
				allowedOpen: true,
			}
		});
	};

});

export default ListObject;