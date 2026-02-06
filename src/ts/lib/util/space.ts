import { I, C, S, U, J, Storage, translate, sidebar, analytics } from 'Lib';

/**
 * UtilSpace provides utilities for working with Anytype spaces.
 *
 * Key responsibilities:
 * - Dashboard and home page management
 * - Space list and space view retrieval
 * - Participant management (permissions, ownership, listing)
 * - Space sharing (invites, links, permissions)
 * - Publishing functionality
 *
 * A "space" in Anytype is a collaborative workspace that can contain
 * objects, types, and relations. Users can have different permissions
 * (owner, writer, reader) in different spaces.
 */
class UtilSpace {

	/**
	 * Opens the dashboard for the current space or the first available space.
	 * @param {any} [param] - Optional parameters for opening the dashboard.
	 */
	openDashboard (param?: any) {
		param = param || {};

		let home = this.getDashboard();
		if (home && (home.id == I.HomePredefinedId.Last)) {
			home = this.getLastObject();
		};

		if (!home) {
			home = { layout: I.ObjectLayout.Settings, id: 'spaceIndexEmpty' };
		};

		U.Object.openRoute(home, param);
		S.Common.setLeftSidebarState('vault', 'widget');
		sidebar.leftPanelSubPageOpen('widget', false, false);
	};

	openDashboardOrVoid (param?: Partial<I.RouteParam>) {
		param = param || {};

		if (undefined === param.replace) {
			param.replace = true;
		};

		if (S.Common.space) {
			U.Space.openDashboard(param);
		} else {
			U.Router.go('/main/void/select', param);
			sidebar.leftPanelSubPageClose(false, false);
		};
	};

	/**
	 * Opens the first available space or a void page if none exist.
	 * @param {(it: any) => boolean} [filter] - Optional filter function for spaces.
	 * @param {Partial<I.RouteParam>} [param] - Optional route parameters.
	 */
	openFirstSpaceOrVoid (filter?: (it: any) => boolean, param?: Partial<I.RouteParam>) {
		param = param || {};

		let spaces = U.Menu.getVaultItems();

		if (filter) {
			spaces = spaces.filter(filter);
		};

		if (spaces.length) {
			U.Router.switchSpace(spaces[0].targetSpaceId, '', false, param, true);
		} else {
			U.Router.go('/main/void/error', param);
			sidebar.leftPanelSubPageClose(false, false);
		};
	};

	oneToOneLink (id: string, key: string, type: 'deeplink' | 'web'): string {
		key = encodeURIComponent(String(key || ''));

		let ret = '';
		switch (type) {
			case 'deeplink': {
				ret = `${J.Constant.protocol}://hi/?id=${id}&key=${key}`;
				break;
			};

			case 'web': {
				ret = `https://hi.any.coop/${id}#${key}`;
				break;
			};
		};
		return ret;
	}

	/**
	 * Opens or creates one-to-one space with given identity.
	 * @param {string} [id] - target user identity.
	 * @param {() => void} [callBack] - Optional callback fn.
	 */
	openOneToOne (id: string, key: string, route: string, callBack?: (message?: any) => void) {
		const { account } = S.Auth;
		if (id == account.id) {
			this.openDashboard();
			callBack?.();
			return;
		};

		const spaceExists = this.getList().filter(it => it.isOneToOne && (it.oneToOneIdentity == id))[0];

		if (spaceExists) {
			U.Router.switchSpace(spaceExists.targetSpaceId, '', true, { onRouteChange: callBack }, false);
			return;
		};

		const details: any = {
			oneToOneIdentity: id,
			spaceUxType: I.SpaceUxType.OneToOne,
			spaceAccessType: I.SpaceType.Shared,
			spaceDashboardId: I.HomePredefinedId.Chat,
			oneToOneRequestMetadataKey: key,
		};

		C.WorkspaceCreate(details, I.Usecase.ChatSpace, (message: any) => {
			if (message.error.code) {
				callBack?.(message);
				return;
			};

			const objectId = message.objectId;

			C.WorkspaceSetInfo(objectId, details, (message: any) => {
				if (message.error.code) {
					callBack?.(message);
					return;
				};

				U.Router.switchSpace(objectId, '', true, { onRouteChange: callBack }, false);
			});

			analytics.event('CreateSpace', { 
				usecase: I.Usecase.ChatSpace,
				middleTime: message.middleTime, 
				uxType: I.SpaceUxType.OneToOne,
				route,
			});
		});
	};

	/**
	 * Gets the dashboard object for the current space.
	 * @returns {any|null} The dashboard object or null if not found.
	 */
	getDashboard () {
		const space = this.getSpaceview();
		if (space.isChat || space.isOneToOne) {
			return this.getChat();
		};

		const id = space.spaceDashboardId;

		if (!id) {
			return null;
		};

		let ret = null;
		switch (id) {
			case I.HomePredefinedId.Graph: {
				ret = this.getGraph();
				break;
			};

			case I.HomePredefinedId.Chat: {
				ret = this.getChat();
				break;
			};

			case I.HomePredefinedId.Last: {
				ret = this.getLastOpened();
				break;
			};

			default: {
				ret = S.Detail.get(U.Space.getSubSpaceSubId(space.targetSpaceId), id);
				break;
			};

		};

		if (!ret || ret._empty_ || ret.isDeleted) {
			return null;
		};
		return ret;
	};

	/**
	 * Gets the list of system dashboard IDs.
	 * @returns {string[]} The list of system dashboard IDs.
	 */
	getSystemDashboardIds () {
		return [ I.HomePredefinedId.Graph, I.HomePredefinedId.Chat, I.HomePredefinedId.Last ];
	};

	/**
	 * Gets the graph dashboard object.
	 * @returns {object} The graph dashboard object.
	 */
	getGraph () {
		return { 
			id: I.HomePredefinedId.Graph, 
			name: translate('commonGraph'), 
			layout: I.ObjectLayout.Graph,
		};
	};

	/**
	 * Gets the last opened dashboard object.
	 * @returns {object} The last opened dashboard object.
	 */
	getLastOpened () {
		return { 
			id: I.HomePredefinedId.Last,
			name: translate('spaceLast'),
		};
	};

	/**
	 * Gets the last opened object for the current window.
	 * @returns {any|null} The last opened object or null if not found.
	 */
	getLastObject () {
		let home = Storage.getLastOpened();

		// Invalid data protection
		if (!home || !home.id) {
			home = null;
		};

		if (home) {
			home.spaceId = S.Common.space;
		};

		return home;
	};

	/**
	 * Gets the chat dashboard object.
	 * @returns {object} The chat dashboard object.
	 */
	getChat () {
		return { 
			id: S.Block.workspace,
			name: translate(`spaceUxType${I.SpaceUxType.Chat}`),
			layout: I.ObjectLayout.Chat,
		};
	};

	/**
	 * Gets the list of active spaces.
	 * @returns {any[]} The list of active spaces.
	 */
	getList () {
		return S.Record.getRecords(J.Constant.subId.space, U.Subscription.spaceRelationKeys(true)).filter(it => it.isAccountActive);
	};

	/**
	 * Gets the list of shared that user owns;
	 * @returns {any[]} The list of active spaces.
	 */
	getMySharedSpacesList () {
		return this.getList().filter(it => U.Space.isMyOwner(it.targetSpaceId) && it.isShared);
	};

	/**
	 * Gets the spaceview object for a given ID or the current spaceview.
	 * @param {string} [id] - The spaceview ID.
	 * @returns {any} The spaceview object.
	 */
	getSpaceview (id?: string) {
		return S.Detail.get(J.Constant.subId.space, id || S.Block.spaceview);
	};

	/**
	 * Gets the spaceview object by space ID.
	 * @param {string} id - The space ID.
	 * @returns {any} The spaceview object.
	 */
	getSpaceviewBySpaceId (id: string) {
		const viewId = S.Record.spaceMap.get(id);
		if (!viewId) {
			return null;
		};	

		const ret = S.Detail.get(J.Constant.subId.space, viewId);
		return ret._empty_ ? null : ret;
	};

	/**
	 * Gets the list of participants, optionally filtered by status.
	 * @param {I.ParticipantStatus[]} [statuses] - Optional list of statuses to filter by.
	 * @returns {any[]} The list of participants.
	 */
	getParticipantsList (statuses?: I.ParticipantStatus[]) {
		const ret = S.Record.getRecords(J.Constant.subId.participant);
		return statuses ? ret.filter(it => statuses.includes(it.status)) : ret;
	};

	/**
	 * Gets the participant ID for a given space and account.
	 * @param {string} spaceId - The space ID.
	 * @param {string} accountId - The account ID.
	 * @returns {string} The participant ID.
	 */
	getParticipantId (spaceId: string, accountId: string) {
		spaceId = String(spaceId || '').replace('.', '_');
		return `_participant_${spaceId}_${accountId}`;
	};

	getCurrentParticipantId () {
		return this.getParticipantId(S.Common.space, S.Auth.account.id);
	};

	/**
	 * Extracts the account ID from a participant ID.
	 * @param {string} id - The participant ID.
	 * @returns {string} The account ID.
	 */
	getAccountFromParticipantId (id: string) {
		const a = String(id || '').split('_');
		return a.length ? a[a.length - 1] : '';
	};

	/**
	 * Gets the profile object for the current user.
	 * @returns {any} The profile object.
	 */
	getProfile () {
		return S.Detail.get(J.Constant.subId.profile, S.Block.profile);
	};

	/**
	 * Gets a participant object by ID or for the current user in the current space.
	 * @param {string} [id] - The participant ID.
	 * @returns {any|null} The participant object or null if not found.
	 */
	getParticipant (id?: string) {
		const { space } = S.Common;
		const { account } = S.Auth;

		if (!account) {
			return null;
		};

		const object = S.Detail.get(J.Constant.subId.participant, id || this.getParticipantId(space, account.id));
		return object._empty_ ? null : object;
	};

	/**
	 * Gets the subspace subId for a given space ID.
	 * @param {string} spaceId - The space ID.
	 * @returns {string} The subspace subId.
	 */
	getSubSpaceSubId (spaceId: string) {
		return [ J.Constant.subId.subSpace, spaceId ].join('-');
	};

	/**
	 * Gets the participant object for the current user in a given space.
	 * @param {string} [spaceId] - The space ID.
	 * @returns {any|null} The participant object or null if not found.
	 */
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

	/**
	 * Gets the creator object for a given space and ID.
	 * @param {string} spaceId - The space ID.
	 * @param {string} id - The creator ID.
	 * @returns {any} The creator object.
	 */
	getCreator (spaceId: string, id: string) {
		return S.Detail.get(this.getSubSpaceSubId(spaceId), id);
	};

	/**
	 * Checks if the current user can write in a given space.
	 * @param {string} [spaceId] - The space ID.
	 * @returns {boolean} True if the user can write, false otherwise.
	 */
	canMyParticipantWrite (spaceId?: string): boolean {
		const participant = this.getMyParticipant(spaceId);
		return participant ? (participant.isWriter || participant.isOwner) : true;
	};

	/**
	 * Checks if the current user is the owner of a given space.
	 * @param {string} [spaceId] - The space ID.
	 * @returns {boolean} True if the user is the owner, false otherwise.
	 */
	isMyOwner (spaceId?: string): boolean {
		const participant = this.getMyParticipant(spaceId || S.Common.space);
		return participant ? participant.isOwner : false;
	};

	/**
	 * Checks if sharing is active for the current space.
	 * @returns {boolean} True if sharing is active, false otherwise.
	 */
	isShareActive () {
		return S.Common.isOnline && !U.Data.isLocalNetwork();
	};

	/**
	 * Gets the reader limit for the current space.
	 * @returns {number} The reader limit.
	 */
	getReaderLimit () {
		const space = this.getSpaceview();
		if (!space) {
			return 0;
		};

		const participants = this.getParticipantsList([ I.ParticipantStatus.Active ]);
		return space.readersLimit - participants.length;
	};

	/**
	 * Gets the writer limit for the current space.
	 * @returns {number} The writer limit.
	 */
	getWriterLimit () {
		const space = this.getSpaceview();
		if (!space) {
			return 0;
		};

		const participants = this.getParticipantsList([ I.ParticipantStatus.Active ]).filter(it => it.isWriter || it.isOwner);
		return space.writersLimit - participants.length;
	};

	/**
	 * Gets the invite link for a given CID and key.
	 * @param {string} cid - The CID.
	 * @param {string} key - The key.
	 * @returns {string} The invite link.
	 */
	getInviteLink (cid: string, key: string) {
		return U.Data.isAnytypeNetwork() ? U.String.sprintf(J.Url.invite, cid, key) : `${J.Constant.protocol}://invite/?cid=${cid}&key=${key}`;
	};

	/**
	 * Gets an invite by ID and calls a callback with the result.
	 * @param {string} id - The invite ID.
	 * @param {(cid: string, key: string, inviteType: I.InviteType) => void} callBack - Callback function.
	 */
	getInvite (id: string, callBack: (cid: string, key: string, inviteType: I.InviteType, permissions: I.ParticipantPermissions) => void) {
		C.SpaceInviteGetCurrent(id, (message: any) => {
			callBack(message.inviteCid, message.inviteKey, message.inviteType, message.permissions);
		});
	};

	/**
	 * Gets the publish domain for the current space.
	 * @returns {string} The publish domain.
	 */
	getPublishDomain (): string {
		const participant = this.getMyParticipant();

		let domain = '';
		if (participant?.globalName) {
			domain = U.String.sprintf(J.Url.publishDomain, participant.globalName);
		} else {
			domain = U.String.sprintf(J.Url.publish, participant.identity);
		};

		return domain;
	};

	/**
	 * Gets the publish URL for a given slug.
	 * @param {string} slug - The slug.
	 * @returns {string} The publish URL.
	 */
	getPublishUrl (slug: string): string {
		return [ 'https:/', this.getPublishDomain(), slug ].join('/');
	};

	/**
	 * Checks if the current user can transfer ownership in the current space.
	 * @returns {boolean} True if the user can transfer ownership, false otherwise.
	 */
	canTransferOwnership (): boolean {
		const spaceview = this.getSpaceview();

		if (!spaceview.isShared || spaceview.isOneToOne || !this.isMyOwner()) {
			return false;
		};

		const members = this.getParticipantsList([ I.ParticipantStatus.Active ]);
		const participant = this.getParticipant();
		
		return !!members.filter(it => it.id !== participant?.id).length;
	};

};

export default new UtilSpace();