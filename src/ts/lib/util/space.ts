import { I, S, U, J, Storage, translate } from 'Lib';

class UtilSpace {

	openDashboard (type: string, param?: any) {
		const fn = U.Common.toCamelCase(`open-${type}`);
		
		let home = this.getDashboard();

		if (home && (home.id == I.HomePredefinedId.Last)) {
			home = Storage.getLastOpened(U.Common.getCurrentElectronWindowId());

			// Invalid data protection
			if (!home || !home.id) {
				home = null;
			};

			if (home) {
				home.spaceId = S.Common.space;
			};
		};

		if (!home) {
			U.Object.openRoute({ layout: I.ObjectLayout.Empty }, param);
			return;
		};

		if (U.Object[fn]) {
			U.Object[fn](home, param);
		};
	};

	getDashboard () {
		const space = this.getSpaceview();
		const id = space.spaceDashboardId;

		if (!id) {
			return null;
		};

		let ret = null;
		if (id == I.HomePredefinedId.Graph) {
			ret = this.getGraph();
		} else
		if (id == I.HomePredefinedId.Last) {
			ret = this.getLastOpened();
		} else {
			ret = S.Detail.get(J.Constant.subId.space, id);
		};

		if (!ret || ret._empty_ || ret.isDeleted) {
			return null;
		};
		return ret;
	};

	getGraph () {
		return { 
			id: I.HomePredefinedId.Graph, 
			name: translate('commonGraph'), 
			iconEmoji: ':earth_americas:',
			layout: I.ObjectLayout.Graph,
		};
	};

	getLastOpened () {
		return { 
			id: I.HomePredefinedId.Last,
			name: translate('spaceLast'),
		};
	};

	getList () {
		return S.Record.getRecords(J.Constant.subId.space, U.Data.spaceRelationKeys()).filter(it => it.isAccountActive && it.isLocalOk);
	};

	getSpaceview (id?: string) {
		return S.Detail.get(J.Constant.subId.space, id || S.Block.spaceview);
	};

	getSpaceviewBySpaceId (id: string) {
		return S.Record.getRecords(J.Constant.subId.space).find(it => it.targetSpaceId == id);
	};

	getParticipantsList (statuses?: I.ParticipantStatus[]) {
		const ret = S.Record.getRecords(J.Constant.subId.participant);
		return statuses ? ret.filter(it => statuses.includes(it.status)) : ret;
	};

	getParticipantId (spaceId: string, accountId: string) {
		spaceId = String(spaceId || '').replace('.', '_');
		return `_participant_${spaceId}_${accountId}`;
	};

	getAccountFromParticipantId (id: string) {
		const a = String(id || '').split('_');
		return a.length ? a[a.length - 1] : '';
	};

	getProfile () {
		return S.Detail.get(J.Constant.subId.profile, S.Block.profile);
	};

	getParticipant (id?: string) {
		const { space } = S.Common;
		const { account } = S.Auth;

		if (!account) {
			return null;
		};

		const object = S.Detail.get(J.Constant.subId.participant, id || this.getParticipantId(space, account.id));
		return object._empty_ ? null : object;
	};

	getMyParticipant (spaceId?: string) {
		const { account } = S.Auth;
		const { space } = S.Common;

		if (!account) {
			return null;
		};

		spaceId = spaceId || space;

		const subId = [ J.Constant.subId.myParticipant, spaceId ].join('-');
		const object = S.Detail.get(subId, this.getParticipantId(spaceId, account.id));

		return object._empty_ ? null : object;
	};

	canMyParticipantWrite (spaceId?: string): boolean {
		const participant = this.getMyParticipant(spaceId);
		return participant ? (participant.isWriter || participant.isOwner) : true;
	};

	isMyOwner (spaceId?: string): boolean {
		const participant = this.getMyParticipant(spaceId || S.Common.space);
		return participant ? participant.isOwner : false;
	};

	isShareActive () {
		return S.Common.isOnline && !U.Data.isLocalNetwork();
	};

	isShareBanner () {
		const hasShared = !!this.getList().find(it => it.isShared && this.isMyOwner(it.targetSpaceId));
		const space = this.getSpaceview();
		const closed = Storage.get('shareBannerClosed');

		return !space.isPersonal && !space.isShared && !closed && this.isMyOwner() && !hasShared;
	};

	getReaderLimit () {
		const space = this.getSpaceview();
		if (!space) {
			return 0;
		};

		const participants = this.getParticipantsList([ I.ParticipantStatus.Active ]);
		return space.readersLimit - participants.length;
	};

	getWriterLimit () {
		const space = this.getSpaceview();
		if (!space) {
			return 0;
		};

		const participants = this.getParticipantsList([ I.ParticipantStatus.Active ]).filter(it => it.isWriter || it.isOwner);
		return space.writersLimit - participants.length;
	};

	getInviteLink (cid: string, key: string) {
		return U.Data.isAnytypeNetwork() ? U.Common.sprintf(J.Url.invite, cid, key) : `${J.Constant.protocol}://invite/?cid=${cid}&key=${key}`;
	};

	canCreateSpace (): boolean {
		const { config } = S.Common;

		if (config.sudo) {
			return true;
		};

		const { account } = S.Auth;
		if (!account) {
			return false;
		};

		const items = U.Common.objectCopy(this.getList().filter(it => it.creator == this.getParticipantId(it.targetSpaceId, account.id)));
		const length = items.length;

		return length < J.Constant.limit.space;
	};

	initSpaceState () {
		const { widgets } = S.Block;
		const blocks = S.Block.getChildren(widgets, widgets);

		Storage.initPinnedTypes();


		if (!blocks.length) {
			return;
		};

		blocks.forEach(block => Storage.setToggle('widget', block.id, true));

		const first = blocks[0];
		const children = S.Block.getChildren(widgets, first.id);

		if (children.length) {
			const object = S.Detail.get(widgets, children[0].getTargetObjectId());

			if (!object._empty_) {
				Storage.setLastOpened(U.Common.getCurrentElectronWindowId(), { id: object.id, layout: object.layout });
				U.Space.openDashboard('route');
			};
		};
	};

};

export default new UtilSpace();
