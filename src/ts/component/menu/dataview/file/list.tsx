import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical, Loader, EmptySearch, ObjectName, ObjectType } from 'Component';
import { I, S, U, J, Relation, keyboard, translate, Action, C } from 'Lib';

interface State {
	isLoading: boolean;
};

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const MENU_ID = 'dataviewFileValues';
const LIMIT = 20;

const MenuDataviewFileList = observer(class MenuDataviewFileList extends React.Component<I.Menu, State> {

	state = {
		isLoading: false,
	};

	_isMounted = false;	
	filter = '';
	cache: any = {};
	offset = 0;
	items: any[] = [];
	refFilter: any = null;
	refList: any = null;
	timeoutFilter = 0;
	top = 0;
	n = -1;

	constructor (props: I.Menu) {
		super(props);
		
		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param, setHover } = this.props;
		const { isLoading } = this.state;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems();

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			
			if (!item) {
				return null;
			};

			const type = S.Record.getTypeById(item.type);

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<MenuItemVertical 
						{...item}
						object={item}
						name={<ObjectName object={item} />}
						onMouseEnter={e => this.onOver(e, item)} 
						onClick={e => this.onClick(e, item)}
						caption={<ObjectType object={type} />}
						style={param.style}
					/>
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				<Filter
					ref={ref => this.refFilter = ref}
					className="outlined"
					placeholderFocus={translate('commonFilterObjects')}
					value={filter}
					onChange={this.onFilterChange} 
					focusOnMount={true}
				/>

				{isLoading ? <Loader /> : ''}

				{!items.length && !isLoading ? (
					<EmptySearch filter={filter} />
				) : ''}

				{this.cache && items.length && !isLoading ? (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length + 1}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!this.items[index]}
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
											rowHeight={({ index }) => this.getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT}
											onScroll={this.onScroll}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				) : ''}

				<div className="bottom">
					<div className="line" />
					<MenuItemVertical 
						id="upload" 
						icon="plus" 
						name={translate('commonUpload')} 
						onClick={this.onUpload}
						onMouseEnter={() => setHover({ id: 'upload' })}
						onMouseLeave={() => setHover()}
					/>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.load(true);
	};

	componentDidUpdate () {
		const items = this.getItems();
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (filter != this.filter) {
			this.filter = filter;
			this.reload();
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => this.getRowHeight(items[i]),
			keyMapper: i => (items[i] || {}).id,
		});

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};

		this.resize();
		this.props.setActive();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeoutFilter);
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const value = Relation.getArrayValue(data.value);

		return U.Common.objectCopy(this.items).filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted && !value.includes(it.id));
	};

	reload () {
		this.n = -1;
		this.offset = 0;
		this.load(true);
	};
	
	load (clear: boolean, callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		let filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() }
		];
		if (data.filters) {
			filters = Object.assign(data.filters);
		};

		if (clear) {
			this.setState({ isLoading: true });
		};

		U.Data.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit: J.Constant.limit.menuRecords,
		}, (message: any) => {
			if (message.error.code) {
				this.setState({ isLoading: false });
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records || []);

			if (clear) {
				this.setState({ isLoading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => this.props.param.data.filter = v, J.Constant.delay.keyboard);
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { close } = this.props;

		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			close();
			return;
		};

		this.onChange(item.id);
	};

	onUpload () {
		Action.openFileDialog({}, paths => {
			C.FileUpload(S.Common.space, '', paths[0], I.FileType.None, {}, (message: any) => {
				if (!message.error.code) {
					this.onChange(message.objectId);
					this.reload();
				};
			});
		});
	};

	onChange (id) {
		const { param, position } = this.props;
		const { data } = param;
		const { onChange, maxCount } = data;

		let value = U.Common.arrayUnique(Relation.getArrayValue(data.value).concat(id));
		if (maxCount) {
			value = value.slice(value.length - maxCount, value.length);
		};

		onChange(value, () => {
			S.Menu.updateData(this.props.id, { value });
			S.Menu.updateData(MENU_ID, { value });
			position();
		});
	};

	getRowHeight (item: any) {
		return item.isDiv ? HEIGHT_DIV : HEIGHT_ITEM;
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 120;
		const itemsHeight = items.reduce((res: number, current: any) => res + this.getRowHeight(current), offset);
		const height = Math.max(HEIGHT_ITEM + offset, Math.min(360, itemsHeight));

		obj.css({ height: (items.length ? height : '') });
		position();
	};

});

export default MenuDataviewFileList;
