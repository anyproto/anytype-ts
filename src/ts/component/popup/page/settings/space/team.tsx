import * as React from 'react';
import { Title, Label, Select, Button, IconObject, ObjectName, Filter } from 'Component';
import { C, I, translate, Util } from 'Lib';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, InfiniteLoader } from 'react-virtualized';
import Head from '../head';
import { detailStore } from 'Store';

interface Props extends I.Popup {
    prevPage: string;
    onPage: (id: string) => void;
};

const HEIGHT = 44;
const LIMIT = 5;
const FILTER_LIMIT = 20;

const PopupSettingsSpaceTeam = observer(class PopupSettingsSpaceTeam extends React.Component<Props> {

    team: any[] = [];
    cache: any = null;
    top = 0;
    filter = '';
    refFilter: any = null;
	refList: any = null;

    constructor (props: any) {
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
            { id: 'reader', name: 'Reader'},
            { id: 'editor', name: 'Editor'},
            { id: 'admin', name: 'Admin'},
            { id: '', name: '', isDiv: true },
            { id: 'remove', name: 'Remove member', icon: 'remove' }
        ];

        const length = this.team.length;
        const listHeight = length ? length > LIMIT ? LIMIT * HEIGHT : length * HEIGHT : HEIGHT;

        const Member = (item: any) => {
            return (
                <div
                    id={'item-' + item.id}
                    className="row flex"
                    style={item.style}
                >
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
                            horizontal={I.MenuDirection.Right}
                            onChange={(v: any) => {
                            }}
                        />
                    </div>
                </div>
            )
        };

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
            <div>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={Util.sprintf(translate('popupSettingsSpaceTeam'), space.name)} />

                <Label className="counter" text={Util.sprintf(translate('popupSettingsSpaceTeamMembers'), length)} />

                {length > FILTER_LIMIT ? (
					<Filter
                    	ref={(ref: any) => { this.refFilter = ref; }}
                    	value={this.filter}
                    	onChange={() => { this.load(); }}
                	/>
				) : ''}

                <div className="rows" id="spaceTeamMembers" style={{ height: listHeight }}>
                    <InfiniteLoader
                        isRowLoaded={({ index }) => !!this.team[index]}
                        loadMoreRows={() => {}}
                        rowCount={this.team.length}
                        threshold={LIMIT}
                    >
                        {({ onRowsRendered, registerChild }) => {
                            return (
                                <AutoSizer className="scrollArea">
                                    {({ width, height }) => (
                                        <List
                                            ref={(ref: any) => { this.refList = ref; }}
                                            height={Number(height) || 0}
                                            width={Number(width) || 0}
                                            deferredMeasurmentCache={this.cache}
                                            rowCount={this.team.length}
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
                    <Button onClick={() => onPage('spaceInvite')} text={translate('popupSettingsSpaceTeamButton')} />
                </div>
            </div>
        );
    };

    componentDidMount() {
        this.load();
    };

    componentDidUpdate() {
        const { position } = this.props;

		if (!this.cache) {
			this.cache = new CellMeasurerCache({
				fixedWidth: true,
				defaultHeight: HEIGHT,
				keyMapper: (i: number) => { return (this.team[i] || {}).id; },
			});
			this.forceUpdate();
		};

        position();

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
		const filter = this.refFilter ? this.refFilter.getValue() : '';
        const filters = [
            { operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: 'ot-profile' }
        ];

        C.ObjectSearch(filters, [], [], filter, 0, 0, (message: any) => {
            if (message.error.code || !message.records.length) {
                return;
            };

            this.team = message.records.map(it => detailStore.check(it)).filter(it => !it._empty_);
            this.forceUpdate();
        });
    };

});

export default PopupSettingsSpaceTeam;