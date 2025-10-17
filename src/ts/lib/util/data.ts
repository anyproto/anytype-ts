import * as Sentry from '@sentry/browser';
import { I, C, M, S, J, U, keyboard, translate, Storage, analytics, dispatcher, Mark, focus, Renderer, Action, Relation } from 'Lib';

const TYPE_KEYS = {
	default: [
		J.Constant.typeKey.page,
		J.Constant.typeKey.note,
		J.Constant.typeKey.task,
		J.Constant.typeKey.collection,
		J.Constant.typeKey.set,
		J.Constant.typeKey.bookmark,
		J.Constant.typeKey.project,
		J.Constant.typeKey.image,
		J.Constant.typeKey.file,
		J.Constant.typeKey.video,
		J.Constant.typeKey.audio,
	],
	chat: [ 
		J.Constant.typeKey.image,
		J.Constant.typeKey.bookmark,
		J.Constant.typeKey.file,
		J.Constant.typeKey.page,
		J.Constant.typeKey.note,
		J.Constant.typeKey.task,
		J.Constant.typeKey.collection,
		J.Constant.typeKey.set,
		J.Constant.typeKey.project,
		J.Constant.typeKey.video,
		J.Constant.typeKey.audio,
	]
};

/**
 * Utility class for data manipulation, formatting, and application-level helpers.
 * Provides methods for block styling, authentication, sorting, and more.
 */
class UtilData {

	/**
	 * Returns the CSS class for a text block style.
	 * @param {I.TextStyle} v - The text style.
	 * @returns {string} The CSS class.
	 */
	blockTextClass (v: I.TextStyle): string {
		return `text${String(I.TextStyle[v] || 'Paragraph')}`;
	};
	
	/**
	 * Returns the CSS class for a div block style.
	 * @param {I.DivStyle} v - The div style.
	 * @returns {string} The CSS class.
	 */
	blockDivClass (v: I.DivStyle): string {
		return `div${String(I.DivStyle[v])}`;
	};

	/**
	 * Returns the CSS class for a layout block style.
	 * @param {I.LayoutStyle} v - The layout style.
	 * @returns {string} The CSS class.
	 */
	blockLayoutClass (v: I.LayoutStyle): string {
		return `layout${String(I.LayoutStyle[v])}`;
	};

	/**
	 * Returns the CSS class for an embed block style.
	 * @param {I.EmbedProcessor} v - The embed processor.
	 * @returns {string} The CSS class.
	 */
	blockEmbedClass (v: I.EmbedProcessor): string {
		return `is${String(I.EmbedProcessor[v])}`;
	};

	/**
	 * Returns the icon class for a given block type and style value.
	 * @param {I.BlockType} type - The block type.
	 * @param {number} v - The style value.
	 * @returns {string} The icon class.
	 */
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

	/**
	 * Returns the CSS class for a block, based on its content and type.
	 * @param {any} block - The block object.
	 * @returns {string} The CSS class string.
	 */
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

	/**
	 * Returns the layout class for an object by id and layout type.
	 * @param {string} id - The object id.
	 * @param {I.ObjectLayout} layout - The layout type.
	 * @returns {string} The layout class.
	 */
	layoutClass (id: string, layout: I.ObjectLayout) {
		let c = '';
		switch (layout) {
			default: c = U.Common.toCamelCase(`is-${I.ObjectLayout[layout]}`); break;
			case I.ObjectLayout.Image:		 c = (id ? 'isImage' : 'isFile'); break;
		};
		return c;
	};

	/**
	 * Returns the class for a link card style.
	 * @param {I.LinkCardStyle} v - The link card style.
	 * @returns {string} The class name.
	 */
	linkCardClass (v: I.LinkCardStyle): string {
		v = v || I.LinkCardStyle.Text;
		return String(I.LinkCardStyle[v]).toLowerCase();
	};

	/**
	 * Returns the class for a card size.
	 * @param {I.CardSize} v - The card size.
	 * @returns {string} The class name.
	 */
	cardSizeClass (v: I.CardSize) {
		v = v || I.CardSize.Small;
		return String(I.CardSize[v]).toLowerCase();
	};

	/**
	 * Returns the class for a diff type.
	 * @param {I.DiffType} v - The diff type.
	 * @returns {string} The class name.
	 */
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

	/**
	 * Returns the class for a sync status object.
	 * @param {I.SyncStatusObject} v - The sync status object.
	 * @returns {string} The class name.
	 */
	syncStatusClass (v: I.SyncStatusObject): string {
		const s = I.SyncStatusObject[v];
		if ('undefined' == typeof(s)) {
			return '';
		};
		return String(s || '').toLowerCase();
	};
	
	/**
	 * Returns the icon class for horizontal alignment.
	 * @param {I.BlockHAlign} v - The horizontal alignment.
	 * @returns {string} The icon class.
	 */
	alignHIcon (v: I.BlockHAlign): string {
		v = v || I.BlockHAlign.Left;
		return `align ${String(I.BlockHAlign[v]).toLowerCase()}`;
	};

	/**
	 * Returns the icon class for vertical alignment.
	 * @param {I.BlockVAlign} v - The vertical alignment.
	 * @returns {string} The icon class.
	 */
	alignVIcon (v: I.BlockVAlign): string {
		v = v || I.BlockVAlign.Top;
		return `valign ${String(I.BlockVAlign[v]).toLowerCase()}`;
	};

	/**
	 * Returns the emoji size parameter for a given text style.
	 * @param {I.TextStyle} t - The text style.
	 * @returns {number} The emoji size.
	 */
	emojiParam (t: I.TextStyle) {
		let s = 20;
		switch (t) {
			case I.TextStyle.Header1:	 s = 30; break;
			case I.TextStyle.Header2:	 s = 26; break;
			case I.TextStyle.Header3: 	 s = 22; break;
		};
		return s;
	};
	
	/**
	 * Sets up application state with account info after login.
	 * @param {I.AccountInfo} info - The account info object.
	 */
	onInfo (info: I.AccountInfo) {
		S.Block.widgetsSet(info.widgetsId);
		S.Block.profileSet(info.profileObjectId);
		S.Block.spaceviewSet(info.spaceViewId);
		S.Block.workspaceSet(info.workspaceObjectId);

		S.Common.gatewaySet(info.gatewayUrl);
		S.Common.spaceSet(info.accountSpaceId);

		analytics.profile(info.analyticsId, info.networkId);
		Sentry.setUser({ id: info.analyticsId });
	};
	
	/**
	 * Handles authentication and routing after login.
	 * @param {any} [param] - Optional parameters for authentication.
	 * @param {() => void} [callBack] - Optional callback after authentication.
	 */
	onAuth (param?: any, callBack?: () => void) {
		param = param || {};
		param.routeParam = param.routeParam || {};

		const { widgets } = S.Block;
		const { redirect, space } = S.Common;
		const routeParam = Object.assign({ replace: true }, param.routeParam);
		const route = param.route || redirect;

		if (!widgets) {
			console.error('[U.Data].onAuth No widgets defined');
			return;
		};

		C.ObjectOpen(widgets, '', space, (message: any) => {
			if (!U.Common.checkErrorOnOpen(widgets, message.error.code, null)) {
				return;
			};

			U.Subscription.createSpace(() => {
				S.Block.updateTypeWidgetList();

				S.Common.pinInit(() => {
					keyboard.initPinCheck();

					const { pin } = S.Common;

					// Redirect
					if (pin && !keyboard.isPinChecked) {
						U.Router.go('/auth/pin-check', routeParam);
					} else {
						if (route) {
							U.Router.go(route, routeParam);
						} else {
							U.Space.openDashboard(routeParam);
						};
					};

					S.Common.redirectSet('');

					if (callBack) {
						callBack();
					};
				});
			});
		});
	};

	/**
	 * Handles one-time authentication tasks after login.
	 * @param {boolean} noTierCache - Whether to skip tier cache.
	 */
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
			const spaceCounters = {};

			for (const item of message.previews) {
				const { spaceId, chatId, message, state, dependencies } = item;
				const spaceSubId = S.Chat.getSpaceSubId(spaceId);
				const chatSubId = S.Chat.getChatSubId(J.Constant.subId.chatPreview, spaceId, chatId);
				const obj: any = spaceCounters[spaceId] || { mentionCounter: 0, messageCounter: 0, lastMessageDate: 0 };

				obj.mentionCounter += state.mentions.counter || 0;
				obj.messageCounter += state.messages.counter || 0;
				obj.lastMessageDate = Math.max(obj.lastMessageDate, Number(message?.createdAt || 0));

				spaceCounters[spaceId] = obj;

				S.Chat.setState(chatSubId, { 
					...state, 
					lastMessageDate: Number(message?.createdAt || 0),
				}, false);

				if (message) {
					message.dependencies = dependencies;

					S.Chat.add(spaceSubId, 0, new M.ChatMessage(message));
					S.Chat.add(chatSubId, 0, new M.ChatMessage(message));
				};
			};

			for (const spaceId in spaceCounters) {
				const spaceSubId = S.Chat.getSpaceSubId(spaceId);
				const obj = spaceCounters[spaceId];

				S.Chat.setState(spaceSubId, { 
					mentions: { counter: obj.mentionCounter, orderId: '' }, 
					messages: { counter: obj.messageCounter, orderId: '' },
					lastMessageDate: obj.lastMessageDate,
					lastStateId: '',
					order: 0,
				}, false);
			};
		});

		this.getMembershipTiers(noTierCache, () => this.getMembershipStatus());
		U.Subscription.createGlobal(() => {
			Storage.clearDeletedSpaces(false);
			Storage.clearDeletedSpaces(true);
		});

		analytics.event('OpenAccount');
	};

	/**
	 * Handles authentication when no space is available.
	 * @param {Partial<I.RouteParam>} [param] - Optional route parameters.
	 */
	onAuthWithoutSpace (param?: Partial<I.RouteParam>) {
		U.Subscription.createGlobal(() => U.Space.openFirstSpaceOrVoid(null, param));
	};

	/**
	 * Creates a new session with the given phrase and key.
	 * @param {string} phrase - The mnemonic phrase.
	 * @param {string} key - The key.
	 * @param {(message: any) => void} [callBack] - Optional callback after session creation.
	 */
	createSession (phrase: string, key: string, token: string, callBack?: (message: any) => void) {
		this.closeSession(() => {
			C.WalletCreateSession(phrase, key, token, (message: any) => {
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

	/**
	 * Closes the current session.
	 * @param {() => void} [callBack] - Optional callback after session close.
	 */
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

	/**
	 * Sets the text and marks for a block, optionally updating the store.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} text - The text to set.
	 * @param {I.Mark[]} marks - The marks to set.
	 * @param {boolean} update - Whether to update the store.
	 * @param {(message: any) => void} [callBack] - Optional callback after setting text.
	 */
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

	/**
	 * Inserts text into a block at the specified range.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} needle - The text to insert.
	 * @param {number} from - The start index.
	 * @param {number} to - The end index.
	 * @param {(message: any) => void} [callBack] - Optional callback after insertion.
	 */
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

	/**
	 * Returns a list of object types available for new objects, with optional filters.
	 * @param {any} [param] - Optional parameters for filtering.
	 * @returns {any[]} The list of object types.
	 */
	getObjectTypesForNewObject (param?: any) {
		const { withLists, limit } = param || {};
		const { space } = S.Common;
		const layouts = U.Object.getPageLayouts();

		let items: any[] = [];

		if (withLists) {
			layouts.push(I.ObjectLayout.Set);
			layouts.push(I.ObjectLayout.Collection);
		};

		items = items.concat(S.Record.getTypes().filter(it => {
			return layouts.includes(it.recommendedLayout) && 
				(it.spaceId == space) &&
				(it.uniqueKey != J.Constant.typeKey.template);
		}));

		items = S.Record.checkHiddenObjects(items);

		if (limit) {
			items = items.slice(0, limit);
		};

		items = items.filter(it => it);
		return S.Record.sortTypes(items);
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
		const { iconEmoji, iconImage, iconName, coverType, coverId } = object;
		const ret = {
			withCover: false,
			withIcon: false,
			className: '',
			layout: object.layout,
			layoutAlign: type?.layoutAlign || I.BlockHAlign.Left,
			layoutWidth: this.getLayoutWidth(rootId),
			headerRelationsLayout: type?.headerRelationsLayout,
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

	/**
	 * Sorts two objects by their name property.
	 * @param {any} c1 - The first object.
	 * @param {any} c2 - The second object.
	 * @returns {number} The sort order.
	 */
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

	/**
	 * Sorts two objects by their orderId and tmpOrder properties.
	 * @param {any} c1 - The first object.
	 * @param {any} c2 - The second object.
	 * @returns {number} The sort order.
	 */
	sortByOrderId (c1: any, c2: any) {
		if (c1.tmpOrder > c2.tmpOrder) return 1;
		if (c1.tmpOrder < c2.tmpOrder) return -1;

		if (c1.orderId > c2.orderId) return 1;
		if (c1.orderId < c2.orderId) return -1;

		return 0;
	};

	/**
	 * Sorts two objects by their hidden status.
	 * @param {any} c1 - The first object.
	 * @param {any} c2 - The second object.
	 * @returns {number} The sort order.
	 */
	sortByHidden (c1: any, c2: any) {
		if (c1.isHidden && !c2.isHidden) return 1;
		if (!c1.isHidden && c2.isHidden) return -1;
		return 0;
	};

	/**
	 * Sorts two objects by their pinned status and last used date.
	 * @param {any} c1 - The first object.
	 * @param {any} c2 - The second object.
	 * @param {string[]} ids - The list of pinned IDs.
	 * @returns {number} The sort order.
	 */
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

	/**
	 * Sorts two objects by a numeric key.
	 * @param {string} key - The key to sort by.
	 * @param {any} c1 - The first object.
	 * @param {any} c2 - The second object.
	 * @param {I.SortType} dir - The sort direction.
	 * @returns {number} The sort order.
	 */
	sortByNumericKey (key: string, c1: any, c2: any, dir: I.SortType) {
		const k1 = Number(c1[key]) || 0;
		const k2 = Number(c2[key]) || 0;

		if (k1 > k2) return dir == I.SortType.Asc ? 1 : -1;
		if (k1 < k2) return dir == I.SortType.Asc ? -1 : 1;
		return this.sortByName(c1, c2);
	};

	/**
	 * Sorts two objects by their weight property.
	 * @param {any} c1 - The first object.
	 * @param {any} c2 - The second object.
	 * @returns {number} The sort order.
	 */
	sortByWeight (c1: any, c2: any) {
		return this.sortByNumericKey('_sortWeight_', c1, c2, I.SortType.Desc);
	};

	/**
	 * Sorts two objects by their format property.
	 * @param {any} c1 - The first object.
	 * @param {any} c2 - The second object.
	 * @returns {number} The sort order.
	 */
	sortByFormat (c1: any, c2: any) {
		return this.sortByNumericKey('format', c1, c2, I.SortType.Asc);
	};

	/**
	 * Sorts two objects by their last used date.
	 * @param {any} c1 - The first object.
	 * @param {any} c2 - The second object.
	 * @returns {number} The sort order.
	 */
	sortByLastUsedDate (c1: any, c2: any) {
		return this.sortByNumericKey('lastUsedDate', c1, c2, I.SortType.Desc);
	};

	typeSortKeys (isChat: boolean) {
		return isChat ? TYPE_KEYS.chat : TYPE_KEYS.default;
	};

	/**
	 * Sorts two objects by their type key.
	 * @param {any} c1 - The first object.
	 * @param {any} c2 - The second object.
	 * @returns {number} The sort order.
	 */
	sortByTypeKey (c1: any, c2: any, isChat: boolean) {
		const keys = this.typeSortKeys(isChat);

		return keys.indexOf(c1.uniqueKey) - keys.indexOf(c2.uniqueKey);
	};

	/**
	 * Checks for objects with a specific relation and type, limited by count.
	 * @param {string} relationKey - The relation key to check.
	 * @param {string} type - The object type.
	 * @param {string[]} ids - The list of IDs to check.
	 * @param {number} limit - The maximum number of results.
	 * @param {(message: any) => void} [callBack] - Optional callback with the result message.
	 */
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

	/**
	 * Returns the default link settings for a block.
	 * @returns {object} The default link settings.
	 */
	defaultLinkSettings () {
		return {
			iconSize: I.LinkIconSize.Small,
			cardStyle: S.Common.linkStyle,
			description: I.LinkDescription.None,
			relations: [],
		};
	};

	/**
	 * Checks and returns link settings for a given content and layout.
	 * @param {I.ContentLink} content - The link content.
	 * @param {I.ObjectLayout} layout - The object layout.
	 * @returns {I.ContentLink} The checked link settings.
	 */
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

	/**
	 * Checks if a cover type is an image.
	 * @param {I.CoverType} type - The cover type.
	 * @returns {boolean} True if the cover is an image.
	 */
	coverIsImage (type: I.CoverType) {
		return [ I.CoverType.Upload, I.CoverType.Source ].includes(type);
	};

	/**
	 * Sets the window title based on the object name.
	 * @param {string} rootId - The root object ID.
	 * @param {string} objectId - The object ID.
	 */
	setWindowTitle (rootId: string, objectId: string) {
		this.setWindowTitleText(U.Object.name(S.Detail.get(rootId, objectId, []), true));
	};

	/**
	 * Sets the window title text directly.
	 * @param {string} name - The name to set as the window title.
	 */
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

	/**
	 * Returns the default graph filters for object queries.
	 * @returns {I.Filter[]} The array of graph filters.
	 */
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

	/**
	 * Moves a list of block IDs to a new page of a given type.
	 * @param {string} rootId - The root object ID.
	 * @param {string[]} ids - The block IDs to move.
	 * @param {string} typeId - The type ID of the new page.
	 * @param {string} route - The route to use after moving.
	 */
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

	/**
	 * Gets the membership status for the current account.
	 * @param {(membership: I.Membership) => void} [callBack] - Optional callback with the membership object.
	 */
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

	/**
	 * Gets the available membership tiers.
	 * @param {boolean} noCache - Whether to skip cache.
	 * @param {() => void} [callBack] - Optional callback after fetching tiers.
	 */
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

	/**
	 * Gets a membership tier by its ID.
	 * @param {I.TierType} id - The tier ID.
	 * @returns {I.MembershipTier} The membership tier object.
	 */
	getMembershipTier (id: I.TierType): I.MembershipTier {
		return S.Common.membershipTiers.find(it => it.id == id) || new M.MembershipTier({ id: I.TierType.None });
	};

	/**
	 * Checks if the current network is Anytype Network.
	 * @returns {boolean} True if Anytype Network.
	 */
	isAnytypeNetwork (): boolean {
		return Object.values(J.Constant.networkId).includes(S.Auth.account?.info?.networkId);
	};

	/**
	 * Checks if the current network is a development network.
	 * @returns {boolean} True if development network.
	 */
	isDevelopmentNetwork (): boolean {
		return S.Auth.account?.info?.networkId == J.Constant.networkId.development;
	};

	/**
	 * Checks if the current network is a local network.
	 * @returns {boolean} True if local network.
	 */
	isLocalNetwork (): boolean {
		return !S.Auth.account?.info?.networkId;
	};

	/**
	 * Creates a new account, handling errors and callbacks.
	 * @param {(text: string) => void} [onError] - Optional error callback.
	 * @param {() => void} [callBack] - Optional callback after account creation.
	 */
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

				this.createSession(phrase, '', '', (message) => {
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
						U.Subscription.createGlobal();

						this.onInfo(message.account.info);

						Renderer.send('keytarSet', message.account.id, phrase);
						Action.importUsecase(S.Common.space, I.Usecase.GetStarted, (message: any) => {
							if (message.startingId) {
								S.Auth.startingId.set(S.Common.space, message.startingId);
							};

							callBack?.();
						});

						analytics.event('CreateAccount', { middleTime: message.middleTime });
						analytics.event('CreateSpace', { middleTime: message.middleTime, usecase: I.Usecase.GetStarted, uxType: I.SpaceUxType.Data });
					});
				});
			});
		});
	};

	/**
	 * Groups records into date sections (e.g., today, yesterday, last week).
	 * @param {any[]} records - The records to group.
	 * @param {string} key - The key to group by.
	 * @param {any} [sectionTemplate] - Optional section template.
	 * @param {I.SortType} [dir] - Optional sort direction.
	 * @returns {any[]} The grouped records.
	 */
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
		records.forEach(record => {
			if (!record) {
				return;
			};

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

	/**
	 * Returns the parameters for creating a link block based on layout and options.
	 * @param {string} id - The target object ID.
	 * @param {I.ObjectLayout} layout - The object layout.
	 * @param {boolean} [allowBookmark] - Whether to allow bookmark layout.
	 * @returns {object} The link block parameters.
	 */
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

	/**
	 * Returns the layout width for a given root object.
	 * @param {string} rootId - The root object ID.
	 * @returns {number} The layout width.
	 */
	getLayoutWidth (rootId: string): number {
		const object = S.Detail.get(rootId, rootId, [ 'type', 'targetObjectType' ], true);
		const type = S.Record.getTypeById(object.targetObjectType || object.type);
		const root = S.Block.getLeaf(rootId, rootId);
		const ret = undefined !== root?.fields?.width ? root?.fields?.width : type?.layoutWidth;

		return Number(ret) || 0;
	};

	/**
	 * Sets the RTL (right-to-left) flag for a block if not already set.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID.
	 */
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

	/**
	 * Gets the list of conflicting relation IDs for a root object.
	 * @param {string} rootId - The root object ID.
	 * @param {(ids: string[]) => void} callBack - Callback with the list of conflicting IDs.
	 */
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

	/**
	 * Sorts the items by their temporary order ID.
	 * @param {string} subId - The subscription ID.
	 * @param {any[]} items - The items to sort.
	 * @param {(callBack: (message: any) => void) => void} request - The request function to get the sorted order.
	 */
	sortByOrderIdRequest (subId: string, items: any[], request: (callBack: (message: any) => void) => void) {
		let s = '';
		items.forEach((it, i) => {
			s = U.Common.lexString(s);
			S.Detail.update(subId, { id: it.id, details: { tmpOrder: s }}, false);
		});

		request(message => {
			if (message.error.code) {
				return;
			};

			const list = message.list;
			for (let i = 0; i < list.length; i++) {
				const item = items[i];
				if (item) {
					S.Detail.update(subId, { id: item.id, details: { orderId: list[i] }}, false);
				};
			};
		});
	};

	widgetContentParam (object: any, block: I.Block): { layout: I.WidgetLayout, limit: number, viewId: string } {
		object = object || {};

		let ret: any = {};

		switch (block.content.section) {
			case I.WidgetSection.Pin: {
				ret = { ...block.content };
				break;
			};

			case I.WidgetSection.Type: {
				ret = { 
					layout: Number(object.widgetLayout) || I.WidgetLayout.Link, 
					limit: Number(object.widgetLimit) || 6, 
					viewId: String(object.widgetViewId) || '',
				};
				break;
			};
		};

		return ret;
	};

	isFreeMember (): boolean {
		const { membership } = S.Auth;
		const tier = this.getMembershipTier(membership.tier);

		return !tier?.namesCount && this.isAnytypeNetwork();
	};

	checkIsArchived (id: string): boolean {
		return S.Record.getRecordIds(J.Constant.subId.archived, '').includes(id);
	};

	checkIsDeleted (id: string): boolean {
		return S.Record.getRecordIds(J.Constant.subId.deleted, '').includes(id);
	};

};

export default new UtilData();