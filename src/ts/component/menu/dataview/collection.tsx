import * as React from 'react';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import $ from 'jquery';
import { Icon, Switch } from 'Component';
import CellObject from 'Component/block/dataview/cell/object';
import {I, C, DataUtil, keyboard, translate, Relation} from 'Lib';
import {menuStore, dbStore, blockStore, detailStore} from 'Store';
import Constant from 'json/constant.json';

const HEIGHT = 28;
const LIMIT = 20;

const MenuCollection = observer(class MenuCollection extends React.Component<I.Menu> {

    node: any = null;
    n = 0;
    top = 0;
    cache: any = {};
    refList: any = null;

    constructor (props: I.Menu) {
        super(props);

        this.onSortStart = this.onSortStart.bind(this);
        this.onSortEnd = this.onSortEnd.bind(this);
        this.onSwitch = this.onSwitch.bind(this);
        this.onScroll = this.onScroll.bind(this);
    };

    render () {
        const { param } = this.props;
        const { data } = param;
        const { readonly, rootId, blockId, getView } = data;
        const items = this.getItems();
        const view = getView();
        const block = blockStore.getLeaf(rootId, blockId);
        const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

        const Handle = SortableHandle(() => (
            <Icon className="dnd" />
        ));

        const Item = SortableElement((item: any) => {
            const canHide = allowedView;
            const canEdit = !readonly && allowedView;
            const subId = dbStore.getSubId(rootId, [ blockId, item.id ].join(':'));
            const cn = [ 'item' ];
            const head = {};

            head[view.groupRelationKey] = item.value;

            if (!canEdit) {
                cn.push('isReadonly');
            };

            return (
                <div
                    ref={node => this.node = node}
                    id={'item-' + item.id}
                    className={cn.join(' ')}
                    onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }}
                    style={item.style}
                >
                    {allowedView ? <Handle /> : ''}
                    <span className="clickable">
						<CellObject
                            id={'menu-group-' + item.id}
                            key={item.id}
                            subId={subId}
                            viewType={I.ViewType.Board}
                            getRecord={() => { return item; }}
                            canEdit={canEdit}
                            relation={item}
                        />
					</span>
                    {canHide ? (
                        <Switch
                            value={!item.isHidden}
                            onChange={(e: any, v: boolean) => { this.onSwitch(e, item, v); }}
                        />
                    ) : ''}
                </div>
            );
        });

        const rowRenderer = (param: any) => {
            const item: any = items[param.index];
            return (
                <CellMeasurer
                    key={param.key}
                    parent={param.parent}
                    cache={this.cache}
                    columnIndex={0}
                    rowIndex={param.index}
                >
                    <Item key={item.id} {...item} index={param.index} style={param.style} />
                </CellMeasurer>
            );
        };

        const List = SortableContainer((item: any) => {
            return (
                <div className="items">
                    <InfiniteLoader
                        rowCount={items.length}
                        loadMoreRows={() => {}}
                        isRowLoaded={() => true}
                        threshold={LIMIT}
                    >
                        {({ onRowsRendered, registerChild }) => (
                            <AutoSizer className="scrollArea">
                                {({ width, height }) => (
                                    <VList
                                        ref={(ref: any) => { this.refList = ref; }}
                                        width={width}
                                        height={height}
                                        deferredMeasurmentCache={this.cache}
                                        rowCount={items.length}
                                        rowHeight={HEIGHT}
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
            );
        });

        return (
            <div className="wrap">
                <List
                    axis="y"
                    lockAxis="y"
                    lockToContainerEdges={true}
                    transitionDuration={150}
                    distance={10}
                    onSortStart={this.onSortStart}
                    onSortEnd={this.onSortEnd}
                    useDragHandle={true}
                    helperClass="isDragging"
                    helperContainer={() => { return $(this.node).find('.items').get(0); }}
                />
            </div>
        );
    };

    componentDidMount() {
        const items = this.getItems();

        this.rebind();
        this.resize();

        this.cache = new CellMeasurerCache({
            fixedWidth: true,
            defaultHeight: HEIGHT,
            keyMapper: (i: number) => { return (items[i] || {}).id; },
        });
    };

    componentDidUpdate () {
        this.resize();
        this.rebind();

        this.props.setActive(null, true);
        this.props.position();

        if (this.refList && this.top) {
            this.refList.scrollToPosition(this.top);
        };
    };

    componentWillUnmount () {
        this.unbind();
        menuStore.closeAll(Constant.menuIds.cell);
    };

    rebind () {
        this.unbind();
        $(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
        window.setTimeout(() => { this.props.setActive(); }, 15);
    };

    unbind () {
        $(window).off('keydown.menu');
    };

    onKeyDown (e: any) {
        let ret = false;
        let items = this.getItems();
        let item = items[this.n];

        keyboard.shortcut('space', e, (pressed: string) => {
            e.preventDefault();

            this.onSwitch(e, item, !item.isVisible);
            ret = true;
        });

        if (ret) {
            return;
        };

        this.props.onKeyDown(e);
    };

    onMouseEnter (e: any, item: any) {
        if (!keyboard.isMouseDisabled) {
            this.props.setActive(item, false);
        };
    };

    onSortStart () {
        const { dataset } = this.props;
        const { selection } = dataset;

        // selection.preventSelect(true);
    };

    onSortEnd (result: any) {
        const { oldIndex, newIndex } = result;
        const { param, dataset } = this.props;
        const { selection } = dataset;
        const { data } = param;
        const { rootId, blockId } = data;

        dbStore.groupsSet(rootId, blockId, arrayMove(this.getItems(), oldIndex, newIndex));
        this.save();

        // selection.preventSelect(false);
    };

    onSwitch (e: any, item: any, v: boolean) {
        const groups = this.getItems();
        const group = groups.find(it => it.id == item.id);

        group.isHidden = !v;
        this.save();
    };

    save () {
        const { param } = this.props;
        const { data } = param;
        const { rootId, blockId, getView } = data;
        const view = getView();
        const groups = this.getItems();
        const update: any[] = [];

        groups.forEach((it: any, i: number) => {
            update.push({ ...it, groupId: it.id, index: i });
        });

        dbStore.groupsSet(rootId, blockId, groups);
        DataUtil.dataviewGroupUpdate(rootId, blockId, view.id, update);
        C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: view.id, groups: update });
    };

    onScroll ({ scrollTop }) {
        if (scrollTop) {
            this.top = scrollTop;
        };
    };

    getItems () {
        const { param } = this.props;
        const { data } = param;
        const { rootId, blockId } = data;
        const block = blockStore.getLeaf(rootId, blockId);
        const { targetObjectId } = block;
        const targetId = targetObjectId ? targetObjectId : rootId;
        const object = detailStore.get(rootId, targetId);
        const subId = dbStore.getSubId(rootId, blockId);

        console.log(object.collectionOf)

        let value: any[] = Relation.getArrayValue(object['collectionOf']);
        value = value.map(id => detailStore.get(subId, id, []));
        value = value.filter(it => !it._empty_);

        console.log(value)

        return value;
    };

    resize () {
        const { getId, position } = this.props;
        const items = this.getItems();
        const obj = $(`#${getId()} .content`);
        const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + 16));

        obj.css({ height: height });
        position();
    };

});

export default MenuCollection;