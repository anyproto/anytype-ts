import * as React from 'react';
import $ from 'jquery';
import { Title, Label, Icon, Input, Button, IconObject, ObjectName, Select, Tag } from 'Component';
import { I, C, translate, UtilCommon, UtilData } from 'Lib';
import { observer } from 'mobx-react';
import { detailStore, popupStore, commonStore } from 'Store';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, InfiniteLoader } from 'react-virtualized';
import Head from '../head';
import Constant from 'json/constant.json';

interface State {
	error: string;
};

const HEIGHT = 64;
const LIMIT = 3;
const MEMBER_LIMIT = 10;

const PopupSettingsSpaceShare = observer(class PopupSettingsSpaceShare extends React.Component<I.PopupSettings, State> {

	cid = '';
	key = '';
	node: any = null;
	team: any[] = [];
	cache: any = null;
	top = 0;
	refInput = null;
	refList: any = null;
	state = {
		error: '',
	};

	constructor (props: I.PopupSettings) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onGenerate = this.onGenerate.bind(this);
		this.onStopSharing = this.onStopSharing.bind(this);
	};

	render () {
		const memberOptions = this.getMemberOptions();
		const length = this.team.length;

		const Member = (item: any) => {
			let tag = null;
			let button = null;

			if (item.isRequested) {
				tag = <Tag color="purple" text={translate('popupSettingsSpaceShareMembersRequested')} />;
				button = (
					<Button
						className="c36"
						color="blank"
						text={translate('popupSettingsSpaceShareMembersViewRequest')}
					/>
				);
			} else 
			if (item.isOwner) {
				button = <span className="owner">owner</span>;
			} else {
				button = (
					<Select
						id={`item-${item.id}-select`}
						value="reader"
						options={memberOptions}
						arrowClassName="light"
						menuParam={{ horizontal: I.MenuDirection.Right }}
						onChange={(v: any) => {
						}}
					/>
				);
			};
		
			return (
				<div id={`item-${item.id}`} className="row" style={item.style} >
					<div className="side left">
						<IconObject size={48} object={item} />
						<ObjectName object={item} />
						{tag}
					</div>
					<div className="side right">
						{button}
					</div>
				</div>
			);
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
			<div ref={node => this.node = node}>
				<Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />

				<div className="titleWrapper">
					<Title text={translate('popupSettingsSpaceShareTitle')} />

					<div className="info">
						<span>{translate('popupSettingsSpaceShareMoreInfo')}</span>
						<Icon className="question" />
					</div>
				</div>

				<div className="section sectionInvite">
					<Title text={translate('popupSettingsSpaceShareInviteLinkTitle')} />
					<Label text={translate('popupSettingsSpaceShareInviteLinkLabel')} />

					<div className="inviteLinkWrapper">
						<Input ref={ref => this.refInput = ref} readonly={true} />
						<Button onClick={this.onCopy} className="c40" color="black" text={translate('commonCopyLink')} />
						<Icon id="generate" className="refresh" onClick={() => this.onGenerate(false)} />
					</div>

					<div className="invitesLimit">
						{UtilCommon.sprintf(translate('popupSettingsSpaceShareInvitesLimit'), MEMBER_LIMIT, UtilCommon.plural(MEMBER_LIMIT, translate('pluralMember')))}
					</div>
				</div>

				<div className="section sectionMembers">
					<Title text={translate('popupSettingsSpaceShareMembersAndRequestsTitle')} />

					{this.cache ? (
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
					) : ''}
				</div>

				<div className="buttons">
					<Button onClick={this.onStopSharing} className="c40" color="blank red" text={translate('popupSettingsSpaceShareStopSharing')} />
				</div>
			</div>
		);
	};

	componentDidMount() {
		this.load();
		this.onGenerate(true);
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
		const filters = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Human }
		];

		UtilData.search({
			filters,
			sorts: [],
		}, (message: any) => {
			if (message.error.code || !message.records.length) {
				return;
			};

			this.team = message.records.map(it => detailStore.mapper(it)).filter(it => !it._empty_);
			this.forceUpdate();
		});
	};

	getLink () {
		return `${Constant.protocol}://main/invite/?cid=${this.cid}&key=${encodeURIComponent(this.key)}`
	};

	onCopy () {
		UtilCommon.copyToast(translate('commonLink'), this.getLink());
	};

	onGenerate (auto: boolean) {
		const { space } = commonStore;
		const node = $(this.node);
		const button = node.find('#generate');

		if (!auto) {
			button.addClass('loading');
		};

		C.SpaceInviteGenerate(space, (message: any) => {
			if (!auto) {
				button.removeClass('loading');
			};

			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			this.cid = message.inviteCid;
			this.key = message.inviteKey;
			this.refInput.setValue(this.getLink());

			if (!auto) {
				this.onCopy();
			};
		});
	};

	onStopSharing () {
		popupStore.open('confirm', {
			data: {
				title: translate('popupConfirmStopSharingSpaceTitle'),
				text: translate('popupConfirmStopSharingSpaceText'),
				textConfirm: translate('popupConfirmStopSharingSpaceConfirm'),
				colorConfirm: 'red',
				onConfirm: () => {
					// stop sharing logic goes here
				},
			},
		});
	};

	getMemberOptions () {
		return [
			{ id: 'reader', name: translate('popupSettingsSpaceMemberTypeReader')},
			{ id: 'editor', name: translate('popupSettingsSpaceMemberTypeEditor')},
			{ id: 'admin', name: translate('popupSettingsSpaceMemberTypeAdmin')},
			{ id: '', name: '', isDiv: true },
			{ id: 'remove', name: translate('popupSettingsSpaceShareRemoveMember'), color: 'red' }
		];
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
