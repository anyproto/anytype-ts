import * as React from 'react';
import { Title, Label, Button, Filter, IconObject, ObjectName, Select } from 'Component';
import { I, translate, UtilCommon, UtilData } from 'Lib';
import { observer } from 'mobx-react';
import { detailStore } from 'Store';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, InfiniteLoader } from 'react-virtualized';
import Head from '../head';

const HEIGHT = 44;
const LIMIT = 5;
const FILTER_LIMIT = 20;

const PopupSettingsSpaceShare = observer(class PopupSettingsSpaceShare extends React.Component<I.PopupSettings> {

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
		const memberOptions = [
			{ id: 'reader', name: translate('popupSettingsSpaceMemberTypeReader')},
			{ id: 'editor', name: translate('popupSettingsSpaceMemberTypeEditor')},
			{ id: 'admin', name: translate('popupSettingsSpaceMemberTypeAdmin')},
			{ id: '', name: '', isDiv: true },
			{ id: 'remove', name: translate('popupSettingsSpaceShareRemoveMember'), icon: 'remove' }
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
			<React.Fragment>
				<Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
				<Title text={translate('popupSettingsSpaceShareTitle')} />

				<div className="section sectionInvite">
					<Title text={translate('popupSettingsSpaceShareInviteLinkTitle')} />
					<Label text={translate('popupSettingsSpaceShareInviteLinkLabel')} />

					<div className="inviteLinkWrapper">

					</div>

					<div className="invitesLimit">{translate('popupSettingsSpaceShareInvitesLimit')}</div>
				</div>

				{this.cache ? (
					<div ref={node => this.node = node} className="section sectionMembers">
						<Title text={translate('popupSettingsSpaceShareMembersAndRequestsTitle')} />

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
									);
								}}
							</InfiniteLoader>
						</div>

						<div className="buttons">
							<Button className="c36" text={translate('popupSettingsSpaceShareStopSharing')} />
						</div>
					</div>
				) : ''}
			</React.Fragment>
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

		console.log('HERE')

		const filter = this.refFilter ? this.refFilter.getValue() : '';
		const filters = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Human }
		];

		UtilData.search({
			filters,
			sorts: [],
			fullText: filter,
		}, (message: any) => {
			console.log('MESSAGE: ', message)
			if (message.error.code || !message.records.length) {
				return;
			};

			this.team = message.records.map(it => detailStore.mapper(it)).filter(it => !it._empty_);
			this.forceUpdate();
		});

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

export default PopupSettingsSpaceShare;
