import { I, C, S, U, J, Storage, translate } from 'Lib';

class UtilSpace {

	openDashboard (param?: any) {
		param = param || {};

		const space = this.getSpaceview();

		if (!space || space._empty_ || space.isAccountDeleted || !space.isLocalOk) {
			this.openFirstSpaceOrVoid(null, param);
			return;
		};
		
		let home = this.getDashboard();
		if (home && (home.id == I.HomePredefinedId.Last)) {
			home = this.getLastObject();
		};
		if (!home) {
			home = { layout: I.ObjectLayout.Settings, id: 'spaceIndexEmpty' };
		};

		U.Object.openRoute(home, param);
	};

	openFirstSpaceOrVoid (filter?: (it: any) => boolean, param?: Partial<I.RouteParam>) {
		param = param || {};

		let spaces = this.getList();

		if (filter) {
			spaces = spaces.filter(filter);
		};

		if (spaces.length) {
			U.Router.switchSpace(spaces[0].targetSpaceId, '', false, param, true);
		} else {
			U.Router.go('/main/void', param);
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
		if (id == I.HomePredefinedId.Chat) {
			ret = this.getChat();
		} else
		if (id == I.HomePredefinedId.Last) {
			ret = this.getLastOpened();
		} else {
			ret = S.Detail.get(U.Space.getSubSpaceSubId(space.targetSpaceId), id);
		};

		if (!ret || ret._empty_ || ret.isDeleted) {
			return null;
		};
		return ret;
	};

	getSystemDashboardIds () {
		return [ I.HomePredefinedId.Graph, I.HomePredefinedId.Chat, I.HomePredefinedId.Last ];
	};

	getGraph () {
		return { 
			id: I.HomePredefinedId.Graph, 
			name: translate('commonGraph'), 
			layout: I.ObjectLayout.Graph,
		};
	};

	getLastOpened () {
		return { 
			id: I.HomePredefinedId.Last,
			name: translate('spaceLast'),
		};
	};

	getLastObject () {
		let home = Storage.getLastOpened(U.Common.getCurrentElectronWindowId());

		// Invalid data protection
		if (!home || !home.id) {
			home = null;
		};

		if (home) {
			home.spaceId = S.Common.space;
		};

		return home;
	};

	getChat () {
		return { 
			id: S.Block.workspace,
			name: translate('commonChat'),
			layout: I.ObjectLayout.Chat,
		};
	};

	getList () {
		return S.Record.getRecords(J.Constant.subId.space, U.Data.spaceRelationKeys()).filter(it => it.isAccountActive);
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

	getSubSpaceSubId (spaceId: string) {
		return [ J.Constant.subId.subSpace, spaceId ].join('-');
	};

	getMyParticipant (spaceId?: string) {
		const { account } = S.Auth;
		const { space } = S.Common;

		if (!account) {
			return null;
		};

		spaceId = spaceId || space;

		const subId = this.getSubSpaceSubId(spaceId);
		const object = S.Detail.get(subId, this.getParticipantId(spaceId, account.id));

		return object._empty_ ? null : object;
	};

	getCreator (spaceId: string, id: string) {
		return S.Detail.get(this.getSubSpaceSubId(spaceId), id);
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

	hasShareBanner () {
		/*
		const hasShared = !!this.getList().find(it => it.isShared && this.isMyOwner(it.targetSpaceId));
		const space = this.getSpaceview();
		const closed = Storage.get('shareBannerClosed');

		return !space.isPersonal && !space.isShared && !closed && this.isMyOwner() && !hasShared;
		*/
		return false;
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

		blocks.forEach(block => Storage.setToggle('widget', block.id, false));
	};

	getInvite (id: string, callBack: (cid: string, key: string) => void) {
		C.SpaceInviteGetCurrent(id, (message: any) => {
			callBack(message.inviteCid, message.inviteKey);
		});
	};

	getPublishDomain (): string {
		const participant = this.getMyParticipant();

		let domain = '';
		if (participant.globalName) {
			domain = U.Common.sprintf(J.Url.publishDomain, participant.globalName);
		} else {
			domain = U.Common.sprintf(J.Url.publish, participant.identity);
		};

		return domain;
	};

	getPublishUrl (slug: string): string {
		return [ this.getPublishDomain(), slug ].join('/');
	};

};

export default new UtilSpace();
