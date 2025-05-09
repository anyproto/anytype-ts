import * as Sentry from '@sentry/browser';
import { I, C, M, S, J, U, keyboard, translate, Storage, analytics, dispatcher, Mark, focus, Renderer, Action, Relation } from 'Lib';

class UtilData {

	blockTextClass (v: I.TextStyle): string {
		return `text${String(I.TextStyle[v] || 'Paragraph')}`;
	};
	
	blockDivClass (v: I.DivStyle): string {
		return `div${String(I.DivStyle[v])}`;
	};

	blockLayoutClass (v: I.LayoutStyle): string {
		return `layout${String(I.LayoutStyle[v])}`;
	};

	blockEmbedClass (v: I.EmbedProcessor): string {
		return `is${String(I.EmbedProcessor[v])}`;
	};

	styleIcon (type: I.BlockType, v: number): string {
		let icon = '';
		switch (type) {
			case I.BlockType.Text:
				switch (v) {
					default:					 icon = this.blockTextClass(v); break;
					case I.TextStyle.Code:		 icon = 'kbd'; break;
				};
				break;

			case I.BlockType.Div: 
				icon = this.blockDivClass(v);
				break;
		};
		return icon;
	};

	blockClass (block: any) {
		const { content } = block;
		const { style, type, processor } = content;
		const dc = U.Common.toCamelCase(`block-${block.type}`);
		const c = [];

		switch (block.type) {
			case I.BlockType.File: {
				if ((style == I.FileStyle.Link) || [ I.FileType.File, I.FileType.None ].includes(type)) {
					c.push(dc);
				} else {
					c.push(`blockMedia is${I.FileType[type]}`);
				};
				break;
			};

			case I.BlockType.Embed: {
				c.push(`blockEmbed ${this.blockEmbedClass(processor)}`);
				break;
			};

			default: {
				c.push(dc);
				switch (block.type) {
					case I.BlockType.Text:					 c.push(this.blockTextClass(style)); break;
					case I.BlockType.Layout:				 c.push(this.blockLayoutClass(style)); break;
					case I.BlockType.Div:					 c.push(this.blockDivClass(style)); break;
				};
				break;
			};
		};
		return c.join(' ');
	};

	layoutClass (id: string, layout: I.ObjectLayout) {
		let c = '';
		switch (layout) {
			default: c = U.Common.toCamelCase(`is-${I.ObjectLayout[layout]}`); break;
			case I.ObjectLayout.Image:		 c = (id ? 'isImage' : 'isFile'); break;
		};
		return c;
	};

	linkCardClass (v: I.LinkCardStyle): string {
		v = v || I.LinkCardStyle.Text;
		return String(I.LinkCardStyle[v]).toLowerCase();
	};

	cardSizeClass (v: I.CardSize) {
		v = v || I.CardSize.Small;
		return String(I.CardSize[v]).toLowerCase();
	};

	diffClass (v: I.DiffType): string {
		let c = '';
		switch (v) {
			case I.DiffType.None: c = 'diffNone'; break;
			case I.DiffType.Add: c = 'diffAdd'; break;
			case I.DiffType.Change: c = 'diffChange'; break;
			case I.DiffType.Remove: c = 'diffRemove'; break;
		};
		return c;
	};

	syncStatusClass (v: I.SyncStatusObject): string {
		const s = I.SyncStatusObject[v];
		if ('undefined' == typeof(s)) {
			return '';
		};
		return String(s || '').toLowerCase();
	};
	
	alignHIcon (v: I.BlockHAlign): string {
		v = v || I.BlockHAlign.Left;
		return `align ${String(I.BlockHAlign[v]).toLowerCase()}`;
	};

	alignVIcon (v: I.BlockVAlign): string {
		v = v || I.BlockVAlign.Top;
		return `valign ${String(I.BlockVAlign[v]).toLowerCase()}`;
	};

	emojiParam (t: I.TextStyle) {
		let s = 20;
		switch (t) {
			case I.TextStyle.Header1:	 s = 30; break;
			case I.TextStyle.Header2:	 s = 26; break;
			case I.TextStyle.Header3: 	 s = 22; break;
		};
		return s;
	};
	
	onInfo (info: I.AccountInfo) {
		S.Block.rootSet(info.homeObjectId);
		S.Block.widgetsSet(info.widgetsId);
		S.Block.profileSet(info.profileObjectId);
		S.Block.spaceviewSet(info.spaceViewId);
		S.Block.workspaceSet(info.workspaceObjectId);

		S.Common.gatewaySet(info.gatewayUrl);
		S.Common.spaceSet(info.accountSpaceId);
		S.Common.getRef('vault')?.setActive(info.spaceViewId);

		analytics.profile(info.analyticsId, info.networkId);
		Sentry.setUser({ id: info.analyticsId });
	};
	
	onAuth (param?: any, callBack?: () => void) {
		param = param || {};
		param.routeParam = param.routeParam || {};

		const { pin } = S.Common;
		const { root, widgets } = S.Block;
		const { redirect, space } = S.Common;
		const routeParam = Object.assign({ replace: true }, param.routeParam);
		const route = param.route || redirect;

		if (!widgets) {
			console.error('[U.Data].onAuth No widgets defined');
			return;
		};

		keyboard.initPinCheck();

		C.ObjectOpen(root, '', space, (message: any) => {
			if (!U.Common.checkErrorOnOpen(root, message.error.code, null)) {
				return;
			};

			C.ObjectOpen(widgets, '', space, (message: any) => {
				if (!U.Common.checkErrorOnOpen(widgets, message.error.code, null)) {
					return;
				};

				U.Subscription.createSpace(() => {
					// Redirect
					if (pin && !keyboard.isPinChecked) {
						U.Router.go('/auth/pin-check', routeParam);
					} else {
						if (route) {
							U.Router.go(route, routeParam);
						} else {
							U.Space.openDashboard(routeParam);
						};

						S.Common.redirectSet('');
					};

					if (callBack) {
						callBack();
					};
				});
			});
		});
	};

	onAuthOnce (noTierCache: boolean) {
		C.NotificationList(false, J.Constant.limit.notification, (message: any) => {
			if (!message.error.code) {
				S.Notification.set(message.list);
			};
		});

		C.FileNodeUsage((message: any) => {
			if (!message.error.code) {
				S.Common.spaceStorageSet(message);
			};
		});

		C.ChatSubscribeToMessagePreviews(J.Constant.subId.chatSpace, (message: any) => {
			for (const item of message.previews) {
				S.Chat.setState(S.Chat.getSubId(item.spaceId, item.chatId), item.state);
			};
		});

		this.getMembershipTiers(noTierCache, () => this.getMembershipStatus());
		U.Subscription.createGlobal(() => Storage.clearDeletedSpaces());

		analytics.event('OpenAccount');
	};

	onAuthWithoutSpace (param?: Partial<I.RouteParam>) {
		U.Subscription.createGlobal(() => U.Space.openFirstSpaceOrVoid(null, param));
	};

	createSession (phrase: string, key: string, callBack?: (message: any) => void) {
		this.closeSession(() => {
			C.WalletCreateSession(phrase, key, (message: any) => {
				if (!message.error.code) {
					S.Auth.tokenSet(message.token);
					S.Auth.appTokenSet(message.appToken);

					dispatcher.startStream();
				};

				if (callBack) {
					callBack(message);
				};
			});
		});
	};

	closeSession (callBack?: () => void) {
		const { token } = S.Auth;

		if (!token) {
			if (callBack) {
				callBack();
			};
			return;
		};

		C.WalletCloseSession(token, () => {
			S.Auth.tokenSet('');

			dispatcher.stopStream();

			if (callBack) {
				callBack();
			};
		});
	};

	blockSetText (rootId: string, blockId: string, text: string, marks: I.Mark[], update: boolean, callBack?: (message: any) => void) {
		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		text = String(text || '');
		marks = marks || [];

		if (update) {
			S.Block.updateContent(rootId, blockId, { text, marks });
		};

		C.BlockTextSetText(rootId, blockId, text, marks, focus.state.range, callBack);
	};

	blockInsertText (rootId: string, blockId: string, needle: string, from: number, to: number, callBack?: (message: any) => void) {
		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const diff = needle.length - (to - from);
		const text = U.Common.stringInsert(block.content.text, needle, from, to);
		const marks = Mark.adjust(block.content.marks, from, diff);

		this.blockSetText(rootId, blockId, text, marks, true, callBack);
	};

	getObjectTypesForNewObject (param?: any) {
		const { withSet, withCollection, limit } = param || {};
		const { space } = S.Common;
		const pageLayouts = U.Object.getPageLayouts();
		const skipLayouts = U.Object.getSetLayouts();
		const pinned = Storage.getPinnedTypes();

		let items: any[] = [];

		items = items.concat(S.Record.getTypes().filter(it => {
			return pageLayouts.includes(it.recommendedLayout) && 
				!skipLayouts.includes(it.recommendedLayout) && 
				(it.spaceId == space) &&
				(it.uniqueKey != J.Constant.typeKey.template);
		}));

		items = S.Record.checkHiddenObjects(items);
		items.sort((c1, c2) => this.sortByPinnedTypes(c1, c2, pinned));

		if (limit) {
			items = items.slice(0, limit);
		};

		if (withSet) {
			items.push(S.Record.getSetType());
		};

		if (withCollection) {
			items.push(S.Record.getCollectionType());
		};

		items = items.filter(it => it);
		return items;
	};

	countTemplatesByTypeId (typeId: string, callBack: (message: any) => void) {
		if (!typeId) {
			return;
		};

		const filters: I.Filter[] = [
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.Equal, value: J.Constant.typeKey.template },
			{ relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: typeId },
		];

		U.Subscription.search({
			filters,
			keys: [ 'id' ],
			noDeps: true,
		}, callBack);
	};

	checkDetails (rootId: string, blockId?: string, keys?: string[]): any {
		blockId = blockId || rootId;
		keys = keys || [];

		const object = S.Detail.get(rootId, blockId, [ 
			'type', 'layout', 'layoutAlign', 'iconImage', 'iconEmoji', 'iconName', 'iconOption', 
			'templateIsBundled', 'featuredRelations', 'targetObjectType',
		].concat(J.Relation.cover).concat(keys), true);
		const type = S.Record.getTypeById(object.targetObjectType || object.type);
		const featuredRelations = Relation.getArrayValue(object.featuredRelations);
		const checkType = S.Block.checkBlockTypeExists(rootId);
		const { iconEmoji, iconImage, iconName, coverType, coverId } = object;
		const ret = {
			withCover: false,
			withIcon: false,
			className: '',
			layout: object.layout,
			layoutAlign: type?.layoutAlign || I.BlockHAlign.Left,
			layoutWidth: this.getLayoutWidth(rootId),
		};

		if (undefined !== object.layoutAlign) {
			ret.layoutAlign = object.layoutAlign;
		};

		let className = [];
		if (!object._empty_) {
			ret.withCover = Boolean((object.coverType != I.CoverType.None) && object.coverId);
			className = [ this.layoutClass(object.id, object.layout), `align${ret.layoutAlign}` ];
		};

		switch (object.layout) {
			default:
				ret.withIcon = Boolean(object.iconEmoji || object.iconImage);
				break;

			case I.ObjectLayout.Note:
			case I.ObjectLayout.Bookmark:
			case I.ObjectLayout.Task: {
				break;
			};

			case I.ObjectLayout.Type: {
				ret.withIcon = Boolean(iconName || iconEmoji) || true;
				break;
			};

			case I.ObjectLayout.Human:
			case I.ObjectLayout.Participant:
			case I.ObjectLayout.Relation: {
				ret.withIcon = true;
				break;
			};
		};

		if (U.Object.isInFileLayouts(object.layout)) {
			ret.withIcon = true;
		};

		if (checkType && !keyboard.isMainHistory()) {
			className.push('noSystemBlocks');
		};

		if (featuredRelations.includes('description')) {
			className.push('withDescription');
		};

		if (object.templateIsBundled) {
			className.push('isBundled');
		};

		if (ret.withIcon && ret.withCover) {
			className.push('withIconAndCover');
		} else
		if (ret.withIcon) {
			className.push('withIcon');
		} else
		if (ret.withCover) {
			className.push('withCover');
		};

		ret.className = className.join(' ');

		return ret;
	};

	sortByName (c1: any, c2: any) {
		const n1 = String(c1.name || '').toLowerCase();
		const n2 = String(c2.name || '').toLowerCase();
		const dn = translate('defaultNamePage').toLowerCase();

		if (!n1 && n2) return 1;
		if (n1 && !n2) return -1;
		if ((n1 == dn) && (n2 != dn)) return 1;
		if ((n1 != dn) && (n2 == dn)) return -1;
		if (n1 > n2) return 1;
		if (n1 < n2) return -1;
		return 0;
	};

	sortByHidden (c1: any, c2: any) {
		if (c1.isHidden && !c2.isHidden) return 1;
		if (!c1.isHidden && c2.isHidden) return -1;
		return 0;
	};

	sortByPinnedTypes (c1: any, c2: any, ids: string[]) {
		const idx1 = ids.indexOf(c1.id);
		const idx2 = ids.indexOf(c2.id);
		const isPinned1 = idx1 >= 0;
		const isPinned2 = idx2 >= 0;

		if (isPinned1 && !isPinned2) return -1;
		if (!isPinned1 && isPinned2) return 1;
		if (idx1 > idx2) return 1;
		if (idx1 < idx2) return -1;
		return this.sortByLastUsedDate(c1, c2);
	};

	sortByNumericKey (key: string, c1: any, c2: any, dir: I.SortType) {
		const k1 = Number(c1[key]) || 0;
		const k2 = Number(c2[key]) || 0;

		if (k1 > k2) return dir == I.SortType.Asc ? 1 : -1;
		if (k1 < k2) return dir == I.SortType.Asc ? -1 : 1;
		return this.sortByName(c1, c2);
	};

	sortByWeight (c1: any, c2: any) {
		return this.sortByNumericKey('_sortWeight_', c1, c2, I.SortType.Desc);
	};

	sortByFormat (c1: any, c2: any) {
		return this.sortByNumericKey('format', c1, c2, I.SortType.Asc);
	};

	sortByLastUsedDate (c1: any, c2: any) {
		return this.sortByNumericKey('lastUsedDate', c1, c2, I.SortType.Desc);
	};

	checkObjectWithRelationCnt (relationKey: string, type: string, ids: string[], limit: number, callBack?: (message: any) => void) {
		const filters: I.Filter[] = [
			{ relationKey: 'type', condition: I.FilterCondition.Equal, value: type },
		];

		if (relationKey && ids.length) {
			filters.push({ relationKey: relationKey, condition: I.FilterCondition.In, value: ids });
		};

		U.Subscription.search({
			filters,
			limit,
		}, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (callBack) {
				callBack(message);
			};
		});
	};

	defaultLinkSettings () {
		return {
			iconSize: I.LinkIconSize.Small,
			cardStyle: S.Common.linkStyle,
			description: I.LinkDescription.None,
			relations: [],
		};
	};

	checkLinkSettings (content: I.ContentLink, layout: I.ObjectLayout) {
		const relationKeys = [ 'type', 'cover', 'tag' ];

		content = U.Common.objectCopy(content);
		content.iconSize = Number(content.iconSize) || I.LinkIconSize.None;
		content.cardStyle = Number(content.cardStyle) || I.LinkCardStyle.Text;
		content.relations = (content.relations || []).filter(it => relationKeys.includes(it));

		if (U.Object.isTaskLayout(layout)) {
			content.iconSize = I.LinkIconSize.Small;
		} else
		if (U.Object.isNoteLayout(layout)) {
			const filter = [ 'type' ];

			content.description = I.LinkDescription.None;
			content.iconSize = I.LinkIconSize.None;
			content.relations = content.relations.filter(it => filter.includes(it)); 
		};

		content.relations = U.Common.arrayUnique(content.relations);
		return content;
	};

	coverIsImage (type: I.CoverType) {
		return [ I.CoverType.Upload, I.CoverType.Source ].includes(type);
	};

	setWindowTitle (rootId: string, objectId: string) {
		this.setWindowTitleText(U.Object.name(S.Detail.get(rootId, objectId, []), true));
	};

	setWindowTitleText (name: string) {
		const space = U.Space.getSpaceview();
		const title = [];

		if (name) {
			title.push(U.Common.shorten(name, 60));
		};

		if (!space._empty_) {
			title.push(space.name);
		};

		title.push(J.Constant.appName);
		document.title = title.join(' - ');
	};

	getGraphFilters () {
		return [
			{ relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true },
			{ relationKey: 'isHiddenDiscovery', condition: I.FilterCondition.NotEqual, value: true },
			{ relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true },
			{ relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true },
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getGraphSkipLayouts() },
			{ relationKey: 'id', condition: I.FilterCondition.NotEqual, value: J.Constant.anytypeProfileId },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] }
		];
	};

	moveToPage (rootId: string, ids: string[], typeId: string, route: string) {
		const type = S.Record.getTypeById(typeId);
		if (!type) {
			return;
		};
		
		C.BlockListConvertToObjects(rootId, ids, type.uniqueKey, type.defaultTemplateId, this.getLinkBlockParam('', type.recommendedLayout, false), (message: any) => {
			if (!message.error.code) {
				analytics.createObject(type.id, type.recommendedLayout, route, message.middleTime);
			};
		});
	};

	getMembershipStatus (callBack?: (membership: I.Membership) => void) {
		if (!this.isAnytypeNetwork()) {
			return;
		};

		C.MembershipGetStatus(true, (message: any) => {
			if (!message.membership) {
				return;
			};

			const membership = new M.Membership(message.membership);
			const { tier } = membership;

			S.Auth.membershipSet(membership);
			analytics.setTier(tier);

			if (callBack) {
				callBack(membership);
			};
		});
	};

	getMembershipTiers (noCache: boolean, callBack?: () => void) {
		const { config, interfaceLang, isOnline } = S.Common;
		const { testPayment } = config;

		if (!isOnline || !this.isAnytypeNetwork()) {
			return;
		};

		C.MembershipGetTiers(noCache, interfaceLang, (message) => {
			if (message.error.code) {
				return;
			};

			const tiers = message.tiers.filter(it => (it.id == I.TierType.Explorer) || (it.isTest == !!testPayment));
			S.Common.membershipTiersListSet(tiers);

			if (callBack) {
				callBack();
			};
		});
	};

	getMembershipTier (id: I.TierType): I.MembershipTier {
		return S.Common.membershipTiers.find(it => it.id == id) || new M.MembershipTier({ id: I.TierType.None });
	};

	isAnytypeNetwork (): boolean {
		return Object.values(J.Constant.networkId).includes(S.Auth.account?.info?.networkId);
	};

	isDevelopmentNetwork (): boolean {
		return S.Auth.account?.info?.networkId == J.Constant.networkId.development;
	};

	isLocalNetwork (): boolean {
		return !S.Auth.account?.info?.networkId;
	};

	accountCreate (onError?: (text: string) => void, callBack?: () => void) {
		onError = onError || (() => {});

		const { networkConfig } = S.Auth;
		const { mode, path } = networkConfig;
		const { dataPath } = S.Common;

		let phrase = '';

		analytics.event('StartCreateAccount');

		this.closeSession(() => {
			C.WalletCreate(dataPath, (message) => {
				if (message.error.code) {
					onError(message.error.description);
					return;
				};

				phrase = message.mnemonic;

				this.createSession(phrase, '', (message) => {
					if (message.error.code) {
						onError(message.error.description);
						return;
					};

					C.AccountCreate('', '', dataPath, U.Common.rand(1, J.Constant.count.icon), mode, path, (message) => {
						if (message.error.code) {
							onError(message.error.description);
							return;
						};

						S.Auth.accountSet(message.account);
						S.Common.configSet(message.account.config, false);

						this.onInfo(message.account.info);
						Renderer.send('keytarSet', message.account.id, phrase);
						Action.importUsecase(S.Common.space, I.Usecase.GetStarted, (message: any) => {
							if (message.startingId) {
								S.Auth.startingId = message.startingId;
							};

							if (callBack) {
								callBack();
							};
						});

						analytics.event('CreateAccount', { middleTime: message.middleTime });
						analytics.event('CreateSpace', { middleTime: message.middleTime, usecase: I.Usecase.GetStarted });
					});
				});
			});
		});
	};

	groupDateSections (records: any[], key: string, sectionTemplate?: any, dir?: I.SortType) {
		const now = U.Date.now();
		const { d, m, y } = U.Date.getCalendarDateParam(now);
		const today = now - U.Date.timestamp(y, m, d);
		const yesterday = now - U.Date.timestamp(y, m, d - 1);
		const lastWeek = now - U.Date.timestamp(y, m, d - 7);
		const lastMonth = now - U.Date.timestamp(y, m - 1, d);
		const groups = {};
		const ids = [ 'today', 'yesterday', 'lastWeek', 'lastMonth', 'older' ];

		if (dir == I.SortType.Asc) {
			ids.reverse();
		};

		ids.forEach(id => groups[id] = []);

		let ret = [];
		records.forEach((record) => {
			const diff = now - record[key];

			let id = '';
			if (diff < today) {
				id = 'today';
			} else
			if (diff < yesterday) {
				id = 'yesterday';
			} else
			if (diff < lastWeek) {
				id = 'lastWeek';
			} else
			if (diff < lastMonth) {
				id = 'lastMonth';
			} else {
				id = 'older';
			};
			groups[id].push(record);
		});

		ids.forEach(id => {
			if (groups[id].length) {
				ret.push(Object.assign({
					id, 
					name: translate(U.Common.toCamelCase([ 'common', id ].join('-'))),
					isSection: true,
				}, sectionTemplate || {}));

				if (dir) {
					groups[id] = groups[id].sort((c1, c2) => U.Data.sortByNumericKey(key, c1, c2, dir));
				};
				ret = ret.concat(groups[id]);
			};
		});
		return ret;
	};

	getLinkBlockParam (id: string, layout: I.ObjectLayout, allowBookmark?: boolean) {
		if (U.Object.isInFileLayouts(layout)) {
			return {
				type: I.BlockType.File,
				content: {
					targetObjectId: id,
					style: I.FileStyle.Embed,
					state: I.FileState.Done,
					type: U.Object.getFileTypeByLayout(layout),
				},
			};
		};

		if (U.Object.isBookmarkLayout(layout) && allowBookmark) {
			return {
				type: I.BlockType.Bookmark,
				content: {
					state: I.BookmarkState.Done,
					targetObjectId: id,
				},
			};
		};

		return {
			type: I.BlockType.Link,
			content: { ...this.defaultLinkSettings(), targetBlockId: id },
		};
	};

	getLayoutWidth (rootId: string): number {
		const object = S.Detail.get(rootId, rootId, [ 'type', 'targetObjectType' ], true);
		const type = S.Record.getTypeById(object.targetObjectType || object.type);
		const root = S.Block.getLeaf(rootId, rootId);
		const ret = undefined !== root?.fields?.width ? root?.fields?.width : type?.layoutWidth;

		return Number(ret) || 0;
	};

	setRtl (rootId: string, blockId: string) {
		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const fields = block.fields || {};
		if (fields.isRtlDetected) {
			return;
		};

		C.BlockListSetFields(rootId, [ 
			{ blockId: block.id, fields: { ...fields, isRtlDetected: true } } 
		], () => {
			C.BlockListSetAlign(rootId, [ block.id ], I.BlockHAlign.Right);
		});
	};

	getConflictRelations (rootId: string, callBack: (ids: string[]) => void) {
		if (!rootId) {
			console.error('[U.Data].getConflictRelations: No rootId');
			return;
		};

		C.ObjectTypeListConflictingRelations(rootId, S.Common.space, (message) => {
			if (message.error.code) {
				return;
			};

			const ids = S.Record.checkHiddenObjects(Relation.getArrayValue(message.conflictRelationIds)
				.map(id => S.Record.getRelationById(id))).map(it => it.id).filter(it => it);

			if (callBack) {
				callBack(ids);
			};
		});
	};

};

export default new UtilData();