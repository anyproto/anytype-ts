import * as React from 'react';
import $ from 'jquery';
import { Title, Label, IconObject, ObjectName } from 'Component';
import { I, U, translate } from 'Lib';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import Head from '../head';

const HEIGHT = 62;

const PopupSettingsSpaceMembers = observer(class PopupSettingsSpaceMembers extends React.Component<I.PageSettingsComponent> {

	node: any = null;
	cache: any = null;
	top = 0;
	refList: any = null;

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
	};

	render () {
		const items = this.getItems();
		const length = items.length;
		const participant = U.Space.getParticipant();

		const Member = (item: any) => {
			const isActive = item.id == participant.id;
			return (
				<div 
					id={`item-${item.id}`} 
					className="row" style={item.style}
					onClick={() => U.Object.openConfig(item)}
				>
					<div className="col">
						<IconObject size={42} object={item} />
						<ObjectName object={item} />
						{isActive ? <div className="caption">({translate('commonYou')})</div> : ''}
					</div>
					<div className="col">
						<Label text={translate(`participantPermissions${item.permissions}`)} />
					</div>
				</div>
			);
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

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
				<Title text={translate('commonMembers')} />

				<div className="section sectionMembers">
					{this.cache ? (
						<div id="list" className="rows">
							<WindowScroller scrollElement={window}>
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
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});
		this.forceUpdate();
	};

	componentDidUpdate() {
		this.resize();
	};

	getItems () {
		return U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	resize () {
		if (this.refList) {
			this.refList.recomputeRowHeights(0);
		};
	};

});

export default PopupSettingsSpaceMembers;
