import * as React from 'react';
import $ from 'jquery';
import { Title, Label, IconObject, ObjectName } from 'Component';
import { I, C, translate } from 'Lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore } from 'Store';
import { AutoSizer, WindowScroller, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import Head from '../head';
import Constant from 'json/constant.json';

const HEIGHT = 62;

const PopupSettingsSpaceMembers = observer(class PopupSettingsSpaceMembers extends React.Component<I.PopupSettings> {

	node: any = null;
	cache: any = null;
	top = 0;
	refList: any = null;

	constructor (props: I.PopupSettings) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
	};

	render () {
		const members = this.getMembers();
		const length = members.length;

		const Member = (item: any) => {
			return (
				<div id={`item-${item.id}`} className="row" style={item.style} >
					<div className="col">
						<IconObject size={42} object={item} />
						<ObjectName object={item} />
					</div>
					<div className="col">
						<Label text={translate(`participantStatus${item.status}`)} />
					</div>
					<div className="col">
						<Label text={translate(`participantPermissions${item.permissions}`)} />
					</div>
				</div>
			);
		};

		const rowRenderer = (param: any) => {
			const item: any = members[param.index];
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
				<Head {...this.props} returnTo="spaceIndex" name={translate('commonBack')} />

				<Title text={translate('popupSettingsSpaceShareMembersTitle')} />

				<div className="section sectionMembers">
					{this.cache ? (
						<div id="list" className="rows">
							<WindowScroller scrollElement={$('#popupSettings-innerWrap').get(0)}>
								{({ height, isScrolling, registerChild, scrollTop }) => (
									<AutoSizer disableHeight={true} className="scrollArea">
										{({ width }) => (
											<List
												ref={ref => this.refList = ref}
												autoHeight={true}
												height={Number(height) || 0}
												width={Number(width) || 0}
												deferredMeasurmentCache={this.cache}
												rowCount={length}
												rowHeight={HEIGHT}
												rowRenderer={rowRenderer}
												onScroll={this.onScroll}
												isScrolling={isScrolling}
												scrollTop={scrollTop}
											/>
										)}
									</AutoSizer>
								)}
							</WindowScroller>
						</div>
					) : ''}
				</div>
			</div>
		);
	};

	componentDidMount() {
		this.updateCache();
	};

	componentDidUpdate() {
		this.resize();
	};

	updateCache () {
		const members = this.getMembers();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (members[i] || {}).id,
		});
		this.forceUpdate();
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getMembers () {
		const subId = Constant.subId.participant;
		const records = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id));

		records.sort((c1, c2) => {
			const isOwner1 = c1.permissions == I.ParticipantPermissions.Owner;
			const isOwner2 = c2.permissions == I.ParticipantPermissions.Owner;

			if (isOwner1 && !isOwner2) return -1;
			if (!isOwner1 && isOwner2) return 1;

			return 0;
		});

		return records;
	};

	resize () {
		const { position } = this.props;

		if (this.refList) {
			this.refList.recomputeRowHeights(0);
		};

		position();
	};

});

export default PopupSettingsSpaceMembers;
