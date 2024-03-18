import { I, UtilCommon, UtilData, UtilObject, Storage, translate } from 'Lib';
import { commonStore, authStore, blockStore, detailStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

class UtilSpace {

	openDashboard (type: string, param?: any) {
		const fn = UtilCommon.toCamelCase(`open-${type}`);
		
		let home = this.getDashboard();
		if (home && (home.id == I.HomePredefinedId.Last)) {
			home = Storage.get('lastOpened');
			if (home && !home.spaceId) {
				home.spaceId = commonStore.space;
			};
		};

		if (!home) {
			UtilObject.openRoute({ layout: I.ObjectLayout.Empty }, param);
			return;
		};

		if (this[fn]) {
			this[fn](home, param);
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

	getSpaceview (id?: string) {
		return detailStore.get(Constant.subId.space, id || blockStore.spaceview);
	};

	getSpaceviewBySpaceId (id: string) {
		const subId = Constant.subId.space;
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id)).find(it => it.targetSpaceId == id);
	};

	getParticipantsList (statuses: I.ParticipantStatus[]) {
		const subId = Constant.subId.participant;
		const records = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id)).filter(it => statuses.includes(it.status));

		return records.sort(UtilData.sortByOwner);
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

	canParticipantWrite (spaceId?: string): boolean {
		const participant = this.getMyParticipant(spaceId);
		return participant ? [ I.ParticipantPermissions.Writer, I.ParticipantPermissions.Owner ].includes(participant.permissions) : true;
	};

	isSpaceOwner (spaceId?: string): boolean {
		const participant = this.getMyParticipant(spaceId || commonStore.space);
		return participant && (participant.permissions == I.ParticipantPermissions.Owner) ? true : false;
	};

};

export default new UtilSpace();
