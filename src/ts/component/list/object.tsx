import * as React from 'react';
import { observer } from 'mobx-react';
import { I, C, S, U, J, Relation, translate, keyboard } from 'Lib';
import { Icon, IconObject, Pager, ObjectName, Cell, SelectionTarget } from 'Component';

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
};

interface State {
	sortId: string;
	sortType: I.SortType;
};

const PREFIX = 'listObject';
const LIMIT = 50;

const ListObject = observer(class ListObject extends React.Component<Props, State> {

	public static defaultProps: Props = {
		spaceId: '',
		subId: '',
		rootId: '',
		columns: [],
		sources: [],
		filters: [],
	};

	state = {
		sortId: '',
		sortType: I.SortType.Desc,
	};

	render () {
		const { sortId, sortType } = this.state;
		const { subId, rootId } = this.props;
		const columns = this.getColumns();
		const items = this.getItems();
		const { offset, total } = S.Record.getMeta(subId, '');

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
					onContextMenu={e => this.onContext(e, item.id)}
				>
					{columns.map(column => {
						const cn = [ 'cell', `c-${column.relationKey}` ];
						const cnc = [ 'cellContent' ];
						const value = item[column.relationKey];

						if (column.className) {
							cnc.push(column.className);
						};

						let content = null;
						let onClick = null;

						if (value) {
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

		return (
			<div className="listObject">
				<div className="table">
					<div className="row isHead">
						{columns.map(column => {
							let arrow = null;

							if (sortId == column.relationKey) {
								arrow = <Icon className={`sortArrow c${sortType}`} />;
							};

							return (
								<div key={`head-${column.relationKey}`} className="cell isHead" onClick={() => this.onSort(column.relationKey)}>
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
		const columns = this.getColumns();

		if (columns.length) {
			this.setState({ sortId: columns[0].relationKey }, () => this.getData(1));
		};
	};

	componentWillUnmount(): void {
		C.ObjectSearchUnsubscribe([ this.props.subId ]);
	};

	getItems () {
		return S.Record.getRecords(this.props.subId, this.getKeys());
	};

	getKeys () {
		return J.Relation.default.concat(this.props.columns.map(it => it.relationKey));
	};

	getColumns (): Column[] {
		return ([ { relationKey: 'name', name: translate('commonName'), isObject: true } ] as any[]).concat(this.props.columns || []);
	};

	getData (page: number, callBack?: (message: any) => void) {
		const { sortId, sortType } = this.state;
		const { spaceId, subId, sources } = this.props;
		const offset = (page - 1) * LIMIT;
		const filters = [
			{ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(this.props.filters || []);

		S.Record.metaSet(subId, '', { offset });

		U.Data.searchSubscribe({
			spaceId,
			subId,
			sorts: [ { relationKey: sortId, type: sortType } ],
			keys: this.getKeys(),
			sources,
			filters,
			offset,
			limit: LIMIT,
			ignoreHidden: true,
			ignoreDeleted: true,
		}, callBack);
	};

	onContext (e: any, id: string): void {
		e.preventDefault();
		e.stopPropagation();

		const { subId, relationKeys } = this.props;
		const selection = S.Common.getRef('selectionProvider');

		let objectIds = selection ? selection.get(I.SelectType.Record) : [];
		if (!objectIds.length) {
			objectIds = [ id ];
		};
		
		S.Menu.open('dataviewContext', {
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			data: {
				objectIds,
				subId,
				relationKeys,
				allowedLinkTo: true,
				allowedOpen: true,
			}
		});
	};

	onSort (relationKey: string): void {
		const { sortId, sortType } = this.state;

		let type = I.SortType.Asc;

		if (sortId == relationKey) {
			type = sortType == I.SortType.Asc ? I.SortType.Desc : I.SortType.Asc;
		};

		this.setState({ sortId: relationKey, sortType: type }, () => this.getData(1));
	};

});

export default ListObject;