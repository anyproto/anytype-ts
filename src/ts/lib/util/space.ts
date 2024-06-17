import { I, UtilCommon, UtilData, UtilObject, Storage, translate } from 'Lib';
import { commonStore, authStore, blockStore, detailStore, dbStore } from 'Store';
const Constant = require('json/constant.json');
const Url = require('json/url.json');

class UtilSpace {

	openDashboard (type: string, param?: any) {
		const fn = UtilCommon.toCamelCase(`open-${type}`);
		
		let home = this.getDashboard();

		if (home && (home.id == I.HomePredefinedId.Last)) {
			home = Storage.getLastOpened(UtilCommon.getCurrentElectronWindowId());

			// Invalid data protection
			if (!home || !home.id) {
				home = null;
			};

			if (home && !home.spaceId) {
				home.spaceId = commonStore.space;
			};
		};

		if (!home) {
			UtilObject.openRoute({ layout: I.ObjectLayout.Empty }, param);
			return;
		};

		if (UtilObject[fn]) {
			UtilObject[fn](home, param);
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
			ret = detailStore.get(Constant.subId.space, id);
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
		const subId = Constant.subId.space;
		const { spaceview } = blockStore;

		let items = dbStore.getRecords(subId, UtilData.spaceRelationKeys());
		items = items.filter(it => it.isAccountActive && it.isLocalOk);
		items = items.map(it => ({ ...it, isActive: spaceview == it.id }));

		items.sort((c1, c2) => {
			if (c1.isActive && !c2.isActive) return -1;
			if (!c1.isActive && c2.isActive) return 1;
			return 0;
		});

		return items;
	};

	getSpaceview (id?: string) {
		return detailStore.get(Constant.subId.space, id || blockStore.spaceview);
	};

	getSpaceviewBySpaceId (id: string) {
		return dbStore.getRecords(Constant.subId.space).find(it => it.targetSpaceId == id);
	};

	getParticipantsList (statuses?: I.ParticipantStatus[]) {
		const ret = dbStore.getRecords(Constant.subId.participant);
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
		return detailStore.get(Constant.subId.profile, blockStore.profile);
	};

	getParticipant (id?: string) {
		const { space } = commonStore;
		const { account } = authStore;

		if (!account) {
			return null;
		};

		const object = detailStore.get(Constant.subId.participant, id || this.getParticipantId(space, account.id));
		return object._empty_ ? null : object;
	};

	getMyParticipant (spaceId?: string) {
		const { account } = authStore;
		const { space } = commonStore;

		if (!account) {
			return null;
		};

		const object = detailStore.get(Constant.subId.myParticipant, this.getParticipantId(spaceId || space, account.id));
		return object._empty_ ? null : object;
	};

	canMyParticipantWrite (spaceId?: string): boolean {
		const participant = this.getMyParticipant(spaceId);
		return participant ? (participant.isWriter || participant.isOwner) : true;
	};

	isMyOwner (spaceId?: string): boolean {
		const participant = this.getMyParticipant(spaceId || commonStore.space);
		return participant ? participant.isOwner : false;
	};

	isShareActive () {
		return commonStore.isOnline && !UtilData.isLocalNetwork();
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
		return UtilData.isAnytypeNetwork() ? UtilCommon.sprintf(Url.invite, cid, key) : `${Constant.protocol}://invite/?cid=${cid}&key=${key}`;
	};

};

export default new UtilSpace();