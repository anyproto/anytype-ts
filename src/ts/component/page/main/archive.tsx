import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache, WindowScroller } from 'react-virtualized';
import { Title, IconObject, Header, Footer, Loader, ObjectName, ObjectDescription, Checkbox, Icon, Filter, Label } from 'Component';
import { C, I, DataUtil, Util, analytics, translate } from 'Lib';
import { menuStore, popupStore, dbStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.PageComponent {
	isPopup?: boolean;
};

interface State {
	loading: boolean;
};

const PageMainArchive = observer(class PageMainArchive extends React.Component<Props, State> {

	_isMounted = false;
	state = {
		loading: false,
	};

	top = 0;
	offset = 0;
	cache: any = null;
	refList: List = null;
	refFilter: Filter = null;
	refCheckbox: Map<string, Checkbox> = new Map();
	selected: string[] = [];
	timeout = 0;

	constructor (props: Props) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onFilterShow = this.onFilterShow.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onSelectAll = this.onSelectAll.bind(this);
		this.onRestore = this.onRestore.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};
	
	render () {
		if (!this.cache) {
			return null;
		};

		const { isPopup } = this.props;
		const { loading } = this.state;
		const items = this.getItems();
		const cnControls = [ 'controls' ];
		
		let buttons: I.ButtonComponent[] = [];
		if (this.selected.length) {
			buttons = buttons.concat([
				{ icon: 'checkbox active', text: 'Deselect all', onClick: this.onSelectAll },
				{ icon: 'restore', text: 'Restore', onClick: this.onRestore },
				{ icon: 'remove', text: 'Delete immediately', onClick: this.onRemove },
			]);
			cnControls.push('withSelected');
		} else {
			buttons.push({ icon: 'checkbox', text: 'Select all', onClick: this.onSelectAll });
		};

		const Button = (item: any) => (
			<div className="element" onClick={item.onClick}>
				<Icon className={item.icon} />
				<div className="name">{item.text}</div>
			</div>
		);

		const Item = (item: any) => (
			<div className="item" onClick={e => this.onClick(e, item)}>
				<Checkbox 
					ref={ref => { this.refCheckbox.set(item.id, ref); }} 
					readonly={true}
					value={this.selected.includes(item.id)}
				/>
				<IconObject object={item} size={48} />

				<div className="info">
					<ObjectName object={item} />
					<ObjectDescription object={item} />
				</div>
			</div>
		);

		const rowRenderer = (param: any) => {
			const item = items[param.index];

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<div className="row" style={param.style}>
						{item.children.map((item: any, i: number) => (
							<Item key={item.id} {...item} />
						))}
					</div>
				</CellMeasurer>
			);
		};

		let controls = (
			<div className={cnControls.join(' ')}>
				<div className="side left">
					{buttons.map((item: any, i: number) => (
						<Button key={i} {...item} />
					))}
				</div>
				<div className="side right">
					<Icon className="search" onClick={this.onFilterShow} />

					<div id="filterWrapper" className="filterWrapper">
						<Filter
							ref={ref => { this.refFilter = ref; }}
							onChange={this.onFilterChange}
							onClear={this.onFilterClear}
							placeholder="Type to search..."
						/>
					</div>
				</div>
			</div>
		);
		let content = null;

		if (!items.length) {
			if (!this.getFilterValue()) {
				controls = null;
			};

			content = (
				<div className="archiveEmpty">
					<div className="inner">
						<Label className="name" text={translate('archiveEmptyLabel')} />
					</div>
				</div>
			);
		} else {
			content = (
				<div className="items">
					{loading ? <Loader id="loader" /> : (
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={({ index }) => true}
						>
							{({ onRowsRendered, registerChild }) => (
								<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
									{({ height, isScrolling, registerChild, scrollTop }) => (
										<AutoSizer className="scrollArea">
											{({ width, height }) => (
												<List
													ref={ref => { this.refList = ref; }}
													width={width}
													height={height}
													deferredMeasurmentCache={this.cache}
													rowCount={items.length}
													rowHeight={64}
													rowRenderer={rowRenderer}
													onRowsRendered={onRowsRendered}
													overscanRowCount={10}
													onScroll={this.onScroll}
													scrollToAlignment="start"
												/>
											)}
										</AutoSizer>
									)}
								</WindowScroller>
							)}
						</InfiniteLoader>
					)}
				</div>
			);
		};

		return (
			<div className="wrapper">
				<Header component="mainEmpty" text="Bin" layout={I.ObjectLayout.Archive} {...this.props} />

				<div className="body">
					<div className="titleWrapper">
						<Icon className="archive" />
						<Title text="Bin" />
					</div>

					{controls}
					{content}
				</div>

				<Footer component="mainObject" />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.getData();
		this.resize();
	};

	componentDidUpdate () {
		const records = dbStore.getRecords(Constant.subId.archive, '');
		const items = this.getItems();

		if (!this.cache) {
			this.cache = new CellMeasurerCache({
				fixedWidth: true,
				defaultHeight: 64,
				keyMapper: i => (items[i] || {}).id,
			});
			this.forceUpdate();
		};

		records.forEach(id => {
			const check = this.refCheckbox.get(id);
			if (check) {
				check.setValue(this.selected.includes(id));
			};
		});

		this.resize();

		if (this.refList) {
			this.refList.recomputeRowHeights();
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
	};

	onFilterShow () {
		const node = $(ReactDOM.findDOMNode(this));
		const wrapper = node.find('#filterWrapper');

		wrapper.addClass('active');
		this.refFilter.focus();
	};

	onFilterChange () {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.getData(); }, 500);
	};

	onFilterClear () {	
		const node = $(ReactDOM.findDOMNode(this));
		const wrapper = node.find('#filterWrapper');

		menuStore.closeAll(Constant.menuIds.store);
		wrapper.removeClass('active');
	};

	onClick (e: React.MouseEvent, item: any) {
		e.stopPropagation();

		const records = dbStore.getRecords(Constant.subId.archive, '');

		if (e.shiftKey) {
			const idx = records.findIndex(id => id == item.id);
			
			if ((idx >= 0) && (this.selected.length > 0)) {
				const indexes = this.getSelectedIndexes().filter(i => i != idx);
				const closest = Util.findClosestElement(indexes, idx);

				if (isFinite(closest)) {
					const [ start, end ] = this.getSelectionRange(closest, idx);
					this.selected = this.selected.concat(records.slice(start, end));
				};
			};
		} else {
			if (this.selected.includes(item.id)) {
				this.selected = this.selected.filter(it => it != item.id);
			} else {
				this.selected.push(item.id);
			};
		};

		this.selected = Util.arrayUnique(this.selected);
		this.forceUpdate();
	};

	getSelectedIndexes () {
		const records = dbStore.getRecords(Constant.subId.archive, '');
		const indexes = this.selected.map(id => records.findIndex(it => it == id));
		return indexes.filter(idx => idx >= 0);
	};

	getSelectionRange (index1: number, index2: number) {
		const [ start, end ] = (index1 >= index2) ? [ index2, index1 ] : [ index1 + 1, index2 + 1 ];
		return [ start, end ];
	};

	onSelectAll () {
		this.selected.length ? this.selectionClear() : this.selectionAll();
	};

	onRestore () {
		const count = this.selected.length;

		C.ObjectListSetIsArchived(this.selected, false, () => {
			analytics.event('RestoreFromBin', { count });
		});
		this.selectionClear();
	};

	onRemove () {
		const count = this.selected.length;

		analytics.event('ShowDeletionWarning');

		popupStore.open('confirm', {
			data: {
				title: `Are you sure you want to delete ${count} ${Util.cntWord(count, 'object', 'objects')}?`,
				text: 'These objects will be deleted irrevocably. You can\'t undo this action.',
				textConfirm: 'Delete',
				onConfirm: () => { 
					C.ObjectListDelete(this.selected); 
					this.selectionClear();

					analytics.event('RemoveCompletely', { count });
				},
				onCancel: () => { this.selectionClear(); }
			},
		});
	};

	selectionAll () {
		this.selected = dbStore.getRecords(Constant.subId.archive, '');
		this.forceUpdate();
	};

	selectionClear () {
		this.selected = [];
		this.forceUpdate();
	};

	getFilterValue () {
		return this.refFilter ? this.refFilter.getValue() : '';
	};

	getData () {
		const filter = this.getFilterValue();
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true },
		];
		const sorts: I.Sort[] = [
			{ type: I.SortType.Desc, relationKey: 'lastModifiedDate' },
		];

		if (filter) {
			console.log('FILTER: ', filter)
			filters.push({ operator: I.FilterOperator.And, relationKey: 'name', condition: I.FilterCondition.Like, value: filter });
		};

		this.setState({ loading: true });

		DataUtil.searchSubscribe({
			subId: Constant.subId.archive,
			filters,
			sorts,
			withArchived: true,
		}, () => {
			this.setState({ loading: false });
		});
	};

	getItems () {
		const ret: any[] = [];
		const records = dbStore.getRecords(Constant.subId.archive, '').map(id => detailStore.get(Constant.subId.archive, id));

		let row = { children: [] };
		let n = 0;

		for (const item of records) {
			row.children.push(item);

			n++;
			if (n == 3) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < 3) {
			ret.push(row);
		};

		return ret.filter(it => it.children.length > 0);
	};

	onScroll ({ scrollTop }) {
		this.top = scrollTop;
	};

	resize () {
		const win = $(window);
		const container = Util.getPageContainer(this.props.isPopup);
		const node = $(ReactDOM.findDOMNode(this));
		const content = $('#popupPage .content');
		const body = node.find('.body');
		const hh = Util.sizeHeader();
		const isPopup = this.props.isPopup && !container.hasClass('full');
		const wh = isPopup ? container.height() : win.height();

		node.css({ height: wh });
		
		if (isPopup) {
			body.css({ height: wh - hh });
			content.css({ minHeight: 'unset', height: '100%' });
		} else {
			body.css({ height: '' });
			content.css({ minHeight: '', height: '' });
		};
	};

});

export default PageMainArchive;