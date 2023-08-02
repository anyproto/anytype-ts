import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache, WindowScroller } from 'react-virtualized';
import { Checkbox, Filter, Icon, IconObject, Loader, ObjectName, EmptySearch } from 'Component';
import { UtilData, I, UtilCommon, translate } from 'Lib';
import { dbStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props {
    subId: string;
    rowLength: number;
    withArchived: boolean;
    buttons: I.ButtonComponent[];
    Info: (item: any) => any;
    iconSize: number;
    textEmpty: string;
    filters?: I.Filter[];
	sorts?: I.Sort[];
    rowHeight?: number;
    resize?: () => void;
    sources?: string[];
};

interface State {
    isLoading: boolean;
};

const ListObjectManager = observer(class ListObjectManager extends React.Component<Props, State> {

    _isMounted = false;
    state = {
        isLoading: false,
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
    };

    render () {
        if (!this.cache) {
            return null;
        };

        const { isLoading } = this.state;
        const { buttons, rowHeight, Info, iconSize } = this.props;
        const items = this.getItems();
        const cnControls = [ 'controls' ];
		const filter = this.getFilterValue();

		if (filter) {
			cnControls.push('withFilter');
		};

		let textEmpty = String(this.props.textEmpty || '');
        let buttonsList: I.ButtonComponent[] = [];

        if (this.selected.length) {
			cnControls.push('withSelected');

            buttonsList.push({ icon: 'checkbox active', text: translate('commonDeselectAll'), onClick: this.onSelectAll });
            buttonsList = buttonsList.concat(buttons);
        } else {
            buttonsList.push({ icon: 'checkbox', text: translate('commonSelectAll'), onClick: this.onSelectAll });
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
                    ref={ref => this.refCheckbox.set(item.id, ref)}
                    readonly={true}
                    value={this.selected.includes(item.id)}
                />
                <IconObject object={item} size={iconSize} />

                <div className="info">
                    <ObjectName object={item} />

                    <Info {...item} />
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
			<div className="controlsWrapper">
				<div className={cnControls.join(' ')}>
					<div className="side left">
						{buttonsList.map((item: any, i: number) => (
							<Button key={i} {...item} />
						))}
					</div>
					<div className="side right">
						<Icon className="search" onClick={this.onFilterShow} />

						<div id="filterWrapper" className="filterWrapper">
							<Filter
								ref={ref => this.refFilter = ref}
								onChange={this.onFilterChange}
								onClear={this.onFilterClear}
								placeholder={translate('commonSearchPlaceholder')}
							/>
						</div>
					</div>
				</div>
			</div>
        );

        let content = null;
        if (!items.length && !isLoading) {
            if (!filter) {
                controls = null;
            } else {
				textEmpty = UtilCommon.sprintf(translate('popupSearchEmptyFilter'), filter);
			};

            content = (
				<EmptySearch text={textEmpty} />
            );
        } else {
            content = (
                <div className="items">
                    {isLoading ? <Loader /> : (
                        <InfiniteLoader
                            rowCount={items.length}
                            loadMoreRows={() => {}}
                            isRowLoaded={({ index }) => true}
                        >
                            {({ onRowsRendered }) => (
                                <WindowScroller scrollElement={$('#popupPage-innerWrap').get(0)}>
                                    {({ height, isScrolling, registerChild, scrollTop }) => (
                                        <AutoSizer className="scrollArea">
                                            {({ width, height }) => (
                                                <List
                                                    ref={ref => this.refList = ref}
                                                    width={width}
                                                    height={height}
                                                    deferredMeasurmentCache={this.cache}
                                                    rowCount={items.length}
                                                    rowHeight={rowHeight || 64}
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
            <div className="objectManagerWrapper">
                {controls}
                {content}
            </div>
        );
    };

    componentDidMount () {
        const { resize } = this.props;
        this._isMounted = true;
        this.getData();

        if (resize) {
            resize();
        };
    };

    componentDidUpdate () {
        const { subId, resize, rowHeight } = this.props;
        const records = dbStore.getRecords(subId, '');
        const items = this.getItems();

        if (!this.cache) {
            this.cache = new CellMeasurerCache({
                fixedWidth: true,
                defaultHeight: rowHeight || 64,
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

        if (resize) {
            resize();
        };

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

        const { subId } = this.props;
        const records = dbStore.getRecords(subId, '');

        if (e.shiftKey) {
            const idx = records.findIndex(id => id == item.id);

            if ((idx >= 0) && (this.selected.length > 0)) {
                const indexes = this.getSelectedIndexes().filter(i => i != idx);
                const closest = UtilCommon.findClosestElement(indexes, idx);

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

        this.selected = UtilCommon.arrayUnique(this.selected);
        this.forceUpdate();
    };

    getSelectedIndexes () {
        const { subId } = this.props;
        const records = dbStore.getRecords(subId, '');
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

    selectionAll () {
        const { subId } = this.props;
        this.selected = dbStore.getRecords(subId, '');
        this.forceUpdate();
    };

    selectionClear () {
        this.selected = [];
        this.forceUpdate();
    };

    onScroll ({ scrollTop }) {
        this.top = scrollTop;
    };

    getData () {
        const { subId, sources, withArchived } = this.props;
        const filter = this.getFilterValue();
        const filters = [].concat(this.props.filters || []);
		const sorts = [].concat(this.props.sorts || []);

        if (filter) {
            filters.push({ operator: I.FilterOperator.And, relationKey: 'name', condition: I.FilterCondition.Like, value: filter });
        };

        this.setState({ isLoading: true });

        UtilData.searchSubscribe({
            subId,
            sorts,
            filters,
            withArchived,
            sources: sources || []
        }, () => {
           this.setState({ isLoading: false });
        });
    };

    getItems () {
        const { subId, rowLength } = this.props;
        const ret: any[] = [];
        const records = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id));

        let row = { children: [] };
        let n = 0;

        for (const item of records) {
            row.children.push(item);

            n++;
            if (n == rowLength) {
                ret.push(row);
                row = { children: [] };
                n = 0;
            };
        };

        if (row.children.length < rowLength) {
            ret.push(row);
        };

        return ret.filter(it => it.children.length > 0);
    };

    getFilterValue () {
        return this.refFilter ? this.refFilter.getValue() : '';
    };

});

export default ListObjectManager;
