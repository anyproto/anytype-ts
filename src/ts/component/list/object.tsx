import * as React from 'react';
import { observer } from 'mobx-react';
import { I, C, UtilData, Relation, UtilObject, translate, keyboard } from 'Lib';
import { IconObject, Pager, ObjectName, Cell, SelectionTarget } from 'Component';
import { detailStore, dbStore, menuStore } from 'Store';
const Constant = require('json/constant.json');

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
				<SelectionTarget 
					id={item.id} 
					type={I.SelectType.Record} 
					className={cn.join(' ')}
					onContextMenu={e => this.onContext(e, item.id)}
				>
					<div className="cell isName">
						<div className="cellContent isName" onClick={() => UtilObject.openPopup(item)}>
							<div className="flex">
								<IconObject object={item} />
								<ObjectName object={item} />
							</div>
						</div>
					</div>

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
									onClick = () => UtilObject.openPopup(object);
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
						};

						return (
							<div key={`cell-${column.relationKey}`} className="cell">
								{content ? <div className={cnc.join(' ')} onClick={onClick}>{content}</div> : ''}
							</div>
						);
					})}
				</SelectionTarget>
			);
		};

		return (
			<div className="listObject">
				<div className="table">
					<div className="row isHead">
						<div className="cell">
							<div className="name">{translate('commonName')}</div>
						</div>

						{columns.map(column => (
							<div key={`head-${column.relationKey}`} className="cell isHead">
								<div className="name">{column.name}</div>
							</div>
						))}
					</div>

					{!items.length ? (
						<div className="row">
							<div className="cell empty">{translate('commonNoObjects')}</div>
						</div>
					) : (
						<React.Fragment>
							{items.map((item: any, i: number) => (
								<Row key={i} {...item} />
							))}
						</React.Fragment>
					)}
				</div>
				
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
		return dbStore.getRecords(this.props.subId, this.getKeys());
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