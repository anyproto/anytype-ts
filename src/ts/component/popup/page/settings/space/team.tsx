import * as React from 'react';
import { Title, Label, Select, Button, IconObject, ObjectName, Filter } from 'Component';
import { C, I, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, InfiniteLoader } from 'react-virtualized';
import Head from '../head';
import { detailStore } from 'Store';

const HEIGHT = 44;
const LIMIT = 5;
const FILTER_LIMIT = 20;

const PopupSettingsSpaceTeam = observer(class PopupSettingsSpaceTeam extends React.Component<I.PopupSettings> {

	node: any = null;
    team: any[] = [];
    cache: any = null;
    top = 0;
    filter = '';
    refFilter: any = null;
	refList: any = null;

    constructor (props: I.PopupSettings) {
        super(props);

        this.onScroll = this.onScroll.bind(this);
    };

    render () {
		if (!this.cache) {
			return null;
		};

        const { onPage } = this.props;
        const space = {
            name: 'Anytype Space',
        };

        const memberOptions = [
			{ id: 'reader', name: translate('popupSettingsSpaceMemberTypeReader')},
			{ id: 'editor', name: translate('popupSettingsSpaceMemberTypeEditor')},
			{ id: 'admin', name: translate('popupSettingsSpaceMemberTypeAdmin')},
            { id: '', name: '', isDiv: true },
            { id: 'remove', name: translate('popupSettingsSpaceTeamRemoveMember'), icon: 'remove' }
        ];

        const length = this.team.length;

        const Member = (item: any) => (
			<div id={'item-' + item.id} className="row" style={item.style} >
				<div className="side left">
					<IconObject size={32} object={item} />
					<ObjectName object={item} />
				</div>
				<div className="side right">
					<Select
						id="memberType"
						value={'reader'}
						options={memberOptions}
						arrowClassName="light"
						menuParam={{ horizontal: I.MenuDirection.Right }}
						onChange={(v: any) => {
						}}
					/>
				</div>
			</div>
		);

        const rowRenderer = (param: any) => {
            const item: any = this.team[param.index];
            return (
                <CellMeasurer
                    key={param.key}
                    parent={param.parent}
                    cache={this.cache}
                    columnIndex={0}
                    rowIndex={param.index}
                    hasFixedWidth={() => {}}
                >
                    <Member key={item.id} {...item} index={param.index} style={param.style} />
                </CellMeasurer>
            );
        };

        return (
            <div ref={node => this.node = node}>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={UtilCommon.sprintf(translate('popupSettingsSpaceTeam'), space.name)} />
                <Label className="counter" text={UtilCommon.sprintf(translate('popupSettingsSpaceTeamMembers'), length)} />

                {length > FILTER_LIMIT ? (
					<Filter
                    	ref={ref => this.refFilter = ref}
                    	value={this.filter}
                    	onChange={() => { this.load(); }}
                	/>
				) : ''}

                <div id="list" className="rows">
                    <InfiniteLoader
                        isRowLoaded={({ index }) => !!this.team[index]}
                        loadMoreRows={() => {}}
                        rowCount={length}
                        threshold={LIMIT}
                    >
                        {({ onRowsRendered, registerChild }) => {
                            return (
                                <AutoSizer className="scrollArea">
                                    {({ width, height }) => (
                                        <List
                                            ref={ref => this.refList = ref}
                                            height={Number(height) || 0}
                                            width={Number(width) || 0}
                                            deferredMeasurmentCache={this.cache}
                                            rowCount={length}
                                            rowHeight={HEIGHT}
                                            onRowsRendered={onRowsRendered}
                                            rowRenderer={rowRenderer}
                                            onScroll={this.onScroll}
                                            overscanRowCount={LIMIT}
                                        />
                                    )}
                                </AutoSizer>
                            )
                        }}
                    </InfiniteLoader>
                </div>

                <div className="buttons">
                    <Button className="c36" onClick={() => onPage('spaceInvite')} text={translate('popupSettingsSpaceTeamButton')} />
                </div>
            </div>
        );
    };

    componentDidMount() {
        this.load();
    };

    componentDidUpdate() {
		if (!this.cache) {
			this.cache = new CellMeasurerCache({
				fixedWidth: true,
				defaultHeight: HEIGHT,
				keyMapper: i => (this.team[i] || {}).id,
			});
			this.forceUpdate();
		};

		this.resize();

        if (this.refList && this.top) {
            this.refList.scrollToPosition(this.top);
        };
    };

    onScroll ({ scrollTop }) {
        if (scrollTop) {
            this.top = scrollTop;
        };
    };

    load () {
		/*
		const filter = this.refFilter ? this.refFilter.getValue() : '';
        const filters = [
            { operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: 'ot-profile' }
        ];

        C.ObjectSearch(filters, [], [], filter, 0, 0, (message: any) => {
            if (message.error.code || !message.records.length) {
                return;
            };

            this.team = message.records.map(it => detailStore.mapper(it)).filter(it => !it._empty_);
            this.forceUpdate();
        });
		*/
    };

	resize () {
		const { position } = this.props;
		const node = $(this.node);
		const list = node.find('#list');
		const length = this.team.length;
		const height = Math.min(HEIGHT * LIMIT, Math.max(HEIGHT, length * HEIGHT));

		list.css({ height });
		position();
	};

});

export default PopupSettingsSpaceTeam;
