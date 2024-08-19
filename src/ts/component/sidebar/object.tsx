import * as React from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Filter, Select, Icon, IconObject, Button, ObjectName, ObjectDescription } from 'Component';
import { I, U, J, S, translate, Storage } from 'Lib';

interface State {
	isLoading: boolean;
};

const LIMIT = 20;
const HEIGHT = 64;
const KEY_SORT = 'sortObject';

const SidebarObject = observer(class SidebarObject extends React.Component<{}, State> {
	
	state = {
		isLoading: false,
	};
	cache: any = {};
	offset = 0;
	refList: any = null;
	sort = '';
	type: I.ObjectContainerType = I.ObjectContainerType.Object;
	searchIds: string[] = null;
	filter = '';
	timeoutFilter = 0;

	constructor (props: any) {
		super(props);

		this.onSort = this.onSort.bind(this);
		this.onSwitchType = this.onSwitchType.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};

    render() {
		const { isLoading } = this.state;
		const items = this.getItems();
		const typeOptions = [
			{ id: I.ObjectContainerType.Object, name: translate('sidebarObjectTypeObject') },
			{ id: I.ObjectContainerType.Type, name: translate('sidebarObjectTypeType') },
			{ id: I.ObjectContainerType.Relation, name: translate('sidebarObjectTypeRelation') },
			{ id: I.ObjectContainerType.Orphan, name: translate('sidebarObjectTypeOrphan') },
		];

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			if (!item) {
				return null;
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<div className="item" style={param.style} onClick={() => this.onClick(item)}>
						<IconObject object={item} size={48} />
						<div className="info">
							<ObjectName object={item} />
							<ObjectDescription object={item} />
						</div>
					</div>
				</CellMeasurer>
			);
		};

        return (
			<div id="containerObject">
				<div className="head">
					<Title text="Library" />

					<div className="sides sidesSort">
						<div className="side left">
							<Select id="object-select-type" value="" options={typeOptions} onChange={this.onSwitchType} />
						</div>
						<div className="side right">
							<Icon id="button-object-sort" className="sort" onClick={this.onSort} />
						</div>
					</div>

					<div className="sides sidesFilter">
						<div className="side left">
							<Filter 
								icon="search"
								placeholder={translate('commonSearch')}
								onChange={this.onFilterChange}
								onClear={this.onFilterClear}
							/>
						</div>
						<div className="side right">
							<Button color="blank" className="c28" text={translate('commonNew')} />
						</div>
					</div>
				</div>

				<div className="body">
					{this.cache && items.length && !isLoading ? (
						<div className="items">
							<InfiniteLoader
								rowCount={items.length + 1}
								loadMoreRows={this.loadMoreRows}
								isRowLoaded={({ index }) => !!items[index]}
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
												rowHeight={HEIGHT}
												rowRenderer={rowRenderer}
												onRowsRendered={onRowsRendered}
												overscanRowCount={10}
												scrollToAlignment="center"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						</div>
					) : ''}
				</div>
			</div>
		);
    };

	componentDidMount () {
		this.load(true);
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});
	};

	componentWillUnmount(): void {
		window.clearTimeout(this.timeoutFilter);
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const option = U.Menu.getObjectContainerSortOptions(this.type).find(it => it.id == this.sort);

		let sorts: I.Sort[] = [];
		let filters: I.Filter[] = [];

		if (this.sort && option) {
			sorts.push({ type: option.type, relationKey: option.relationKey });
		} else {
			sorts = sorts.concat([
				{ type: I.SortType.Desc, relationKey: 'createdDate' },
				{ type: I.SortType.Asc, relationKey: 'name' },
			]);
		};

		if (this.searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: this.searchIds || [] });
		};

		switch (this.type) {
			case I.ObjectContainerType.Object: {
				filters.push({ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() });
				break;
			};

			case I.ObjectContainerType.Type: {
				filters.push({ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type });
				break;
			};

			case I.ObjectContainerType.Relation: {
				filters.push({ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Relation });
				break;
			};

			case I.ObjectContainerType.Orphan: {
				filters = filters.concat([
					{ relationKey: 'links', condition: I.FilterCondition.Empty, value: null },
					{ relationKey: 'backlinks', condition: I.FilterCondition.Empty, value: null }
				]);
				break;
			};
		};

		if (clear) {
			this.setState({ isLoading: true });
			S.Record.recordsSet(J.Constant.subId.allObject, '', []);
		};

		U.Data.searchSubscribe({
			subId: J.Constant.subId.allObject,
			filters,
			sorts,
			offset: 0,
			limit: this.offset + J.Constant.limit.menuRecords,
			ignoreHidden: true,
			ignoreDeleted: true,
		}, (message: any) => {
			this.setState({ isLoading: false });

			if (callBack) {
				callBack(message);
			};
		});
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	getItems () {
		return S.Record.getRecords(J.Constant.subId.allObject);
	};

	onClick (item: any) {
		U.Object.openConfig(item);
	};

	onSort (e: any) {
		const options = U.Menu.getObjectContainerSortOptions(this.type);

		S.Menu.open('select', {
			element: '#sidebar #containerObject #button-object-sort',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options,
				value: this.sort,
				onSelect: (e: any, item: any) => {
					this.sort = item.id;
					this.load(true);

					Storage.set(this.getSortKey(this.type), item.id);
				},
			}
		});
	};

	onSwitchType (id: string) {
		this.type = id as I.ObjectContainerType;
		this.load(true);
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			if (this.filter == v) {
				return;
			};

			this.filter = v;

			if (v) {
				U.Data.search({
					filters: [],
					sorts: [],
					fullText: v,
					keys: [ 'id' ],
				}, (message: any) => {
					this.searchIds = (message.records || []).map(it => it.id);
					this.load(true);
				});
			} else {
				this.searchIds = null;
				this.load(true);
			};
		}, J.Constant.delay.keyboard);
	};

	onFilterClear () {
		this.searchIds = null;
		this.load(true);
	};

	getSortKey (tab: I.ObjectContainerType) {
		return U.Common.toCamelCase(`${KEY_SORT}-${tab}`);
	};

});

export default SidebarObject;