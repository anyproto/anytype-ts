import * as React from 'react';
import { observer } from 'mobx-react';
import { I, C, UtilData, Relation, UtilObject, translate } from 'Lib';
import { IconObject, Pager, ObjectName, Cell } from 'Component';
import { detailStore, dbStore } from 'Store';
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
	rootId: string;
	columns: Column[];
};

const PREFIX = 'listObject';
const LIMIT = 50;

const ListObject = observer(class ListObject extends React.Component<Props> {

	render () {
		const { rootId, columns } = this.props;
		const subId = this.getSubId();
		const items = this.getItems();
		const { offset, total } = dbStore.getMeta(subId, '');

		let pager = null;
		if (total && items.length) {
			pager = (
				<Pager 
					offset={offset} 
					limit={LIMIT} 
					total={total} 
					onChange={(page: number) => { this.getData(page); }} 
				/>
			);
		};

		const Row = (item: any) => {
			const cn = [ 'row' ];

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
				<tr className={cn.join(' ')}>
					<td className="cell">
						<div className="cellContent isName" onClick={(e: any) => { UtilObject.openEvent(e, item); }}>
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
									onClick = (e: any) => UtilObject.openEvent(e, object);
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
										recordId={item.id}
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
							<td key={`cell-${column.relationKey}`} className="cell">
								{content ? (
									<div className={cnc.join(' ')} onClick={onClick}>
										{content}
									</div>
								) : ''}
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
		C.ObjectSearchUnsubscribe([ this.getSubId() ]);
	};

	getItems () {
		const subId = this.getSubId();
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, this.getKeys()));
	};

	getSubId () {
		return dbStore.getSubId(this.props.rootId, 'data');
	};

	getKeys () {
		return Constant.defaultRelationKeys.concat(this.props.columns.map(it => it.relationKey));
	};

	getData (page: number, callBack?: (message: any) => void) {
		const { rootId } = this.props;
		const offset = (page - 1) * LIMIT;
		const subId = this.getSubId();

		dbStore.metaSet(subId, '', { offset });

		UtilData.searchSubscribe({
			subId,
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc, includeTime: true }
			],
			keys: this.getKeys(),
			sources: [ rootId ],
			offset,
			limit: LIMIT,
			ignoreHidden: true,
			ignoreDeleted: true,
		}, callBack);
	};

});

export default ListObject;