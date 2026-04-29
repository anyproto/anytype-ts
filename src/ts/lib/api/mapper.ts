import * as I from 'Interface';
import * as M from 'Model';

/**
 * Mapper provides bidirectional conversion between protobuf messages
 * and TypeScript interfaces.
 *
 * With ts-proto bindings, protobuf messages are plain JS objects.
 * - From: Converts received protobuf objects to app TypeScript interfaces
 * - To: Converts app TypeScript objects to protobuf-shaped plain objects
 * - Event: Specialized mappers for real-time event processing
 */

/**
 * Maps ts-proto Block optional property names to application BlockType values.
 */
const PROP_TO_BLOCK_TYPE: Record<string, I.BlockType> = {
	smartblock: I.BlockType.Page,
	text: I.BlockType.Text,
	file: I.BlockType.File,
	layout: I.BlockType.Layout,
	div: I.BlockType.Div,
	bookmark: I.BlockType.Bookmark,
	link: I.BlockType.Link,
	dataview: I.BlockType.Dataview,
	relation: I.BlockType.Relation,
	featuredRelations: I.BlockType.Featured,
	latex: I.BlockType.Embed,
	table: I.BlockType.Table,
	tableColumn: I.BlockType.TableColumn,
	tableRow: I.BlockType.TableRow,
	tableOfContents: I.BlockType.TableOfContents,
	widget: I.BlockType.Widget,
	chat: I.BlockType.Chat,
};

/**
 * Reverse mapping: application BlockType string to ts-proto property name.
 */
const BLOCK_TYPE_TO_PROP: Record<string, string> = {};
for (const [prop, blockType] of Object.entries(PROP_TO_BLOCK_TYPE)) {
	BLOCK_TYPE_TO_PROP[blockType] = prop;
};

/**
 * Excluded keys that are not event properties on a ts-proto Event_Message.
 */
const EVENT_SKIP_KEYS = new Set([ 'spaceId' ]);

/**
 * Derive the event type from a ts-proto property name by capitalizing the first letter.
 * The middleware uses camelCase property names that map 1:1 to PascalCase event types.
 */
const eventType = (prop: string): string => {
	return prop.charAt(0).toUpperCase() + prop.slice(1);
};

export const Mapper = {

	/**
	 * Detect BlockType from a ts-proto Block object's optional content properties.
	 */
	BlockType: (obj: any): I.BlockType => {
		for (const prop in PROP_TO_BLOCK_TYPE) {
			if (obj[prop] !== undefined) {
				return PROP_TO_BLOCK_TYPE[prop];
			};
		};
		return I.BlockType.Empty;
	},

	BoardGroupType (obj: any): string {
		if (obj.status !== undefined) return 'status';
		if (obj.tag !== undefined) return 'tag';
		if (obj.checkbox !== undefined) return 'checkbox';
		if (obj.date !== undefined) return 'date';
		return '';
	},

	NotificationPayload (obj: any): string {
		if (obj.import !== undefined) return 'import';
		if (obj.export !== undefined) return 'export';
		if (obj.galleryImport !== undefined) return 'galleryImport';
		if (obj.requestToJoin !== undefined) return 'requestToJoin';
		if (obj.requestToLeave !== undefined) return 'requestToLeave';
		if (obj.participantRequestApproved !== undefined) return 'participantRequestApproved';
		if (obj.participantRemove !== undefined) return 'participantRemove';
		if (obj.participantRequestDecline !== undefined) return 'participantRequestDecline';
		if (obj.participantPermissionsChange !== undefined) return 'participantPermissionsChange';
		return '';
	},

	ProcessType (obj: any): string {
		if (obj.dropFiles !== undefined) return 'dropFiles';
		if (obj.import !== undefined) return 'import';
		if (obj.export !== undefined) return 'export';
		if (obj.saveFile !== undefined) return 'saveFile';
		if (obj.migration !== undefined) return 'migration';
		return '';
	},

	/**
	 * From: Converters for transforming protobuf messages TO TypeScript objects.
	 * Used when receiving data from the middleware.
	 */
	From: {

		Account: (obj: any): I.Account => {
			return {
				id: obj.id,
				info: obj.info ? Mapper.From.AccountInfo(obj.info) : null,
				config: obj.config ? Mapper.From.AccountConfig(obj.config) : null,
				status: obj.status ? Mapper.From.AccountStatus(obj.status) : null,
			};
		},

		AccountInfo: (obj: any): I.AccountInfo => {
			return {
				profileObjectId: obj.profileObjectId,
				gatewayUrl: obj.gatewayUrl,
				deviceId: obj.deviceId,
				accountSpaceId: obj.accountSpaceId,
				techSpaceId: obj.techSpaceId,
				spaceViewId: obj.spaceViewId,
				widgetsId: obj.widgetsId,
				analyticsId: obj.analyticsId,
				networkId: obj.networkId,
				workspaceObjectId: obj.workspaceObjectId,
				ethereumAddress: obj.ethereumAddress,
				metadataKey: obj.metaDataKey,
			};
		},

		AccountConfig: (obj: any): I.AccountConfig => {
			return {};
		},

		AccountStatus: (obj: any): I.AccountStatus => {
			return {
				type: obj.statusType as number,
				date: obj.deletionDate,
			};
		},

		ObjectInfo: (obj: any): I.PageInfo => {
			return {
				id: obj.id,
				details: Decode.struct(obj.details),
				snippet: obj.snippet,
				hasInboundLinks: obj.hasInboundLinks,
			};
		},

		Record: (obj: any): any => {
			return Decode.struct(obj);
		},

		Range: (obj: any): I.TextRange => {
			return {
				from: obj.from,
				to: obj.to,
			};
		},

		Mark: (obj: any): I.Mark => {
			return {
				type: obj.type as number,
				param: obj.param,
				range: Mapper.From.Range(obj.range),
			};
		},

		PreviewLink: (obj: any) => {
			return {
				type: obj.type,
				title: obj.title,
				description: obj.description,
				faviconUrl: obj.faviconUrl,
				imageUrl: obj.imageUrl,
				url: obj.url,
			};
		},

		Details: (obj: any): any => {
			return {
				id: obj.id,
				details: Decode.struct(obj.details),
			};
		},

		BlockPage: () => {
			return {};
		},

		BlockFeatured: () => {
			return {};
		},

		BlockLayout: (obj: any) => {
			return {
				style: obj.style,
			};
		},

		BlockDiv: (obj: any) => {
			return {
				style: obj.style,
			};
		},

		BlockLink: (obj: any) => {
			return {
				targetBlockId: obj.targetBlockId,
				iconSize: obj.iconSize,
				cardStyle: obj.cardStyle,
				description: obj.description,
				relations: obj.relations || [],
			};
		},

		BlockBookmark: (obj: any) => {
			return {
				targetObjectId: obj.targetObjectId,
				state: obj.state,
				url: obj.url,
			};
		},

		BlockText: (obj: any) => {
			let marks = [];
			if (obj.marks) {
				marks = (obj.marks.marks || []).map(Mapper.From.Mark);
			};

			return {
				text: obj.text,
				style: obj.style,
				checked: obj.checked,
				color: obj.color,
				marks,
				iconEmoji: obj.iconEmoji,
				iconImage: obj.iconImage,
			};
		},

		BlockFile: (obj: any) => {
			return {
				targetObjectId: obj.targetObjectId,
				type: obj.type,
				style: obj.style,
				addedAt: obj.addedAt,
				state: obj.state,
			};
		},

		BlockDataview: (obj: any) => {
			return {
				sources: obj.source || [],
				viewId: obj.activeView,
				views: (obj.views || []).map(Mapper.From.View),
				relationLinks: (obj.relationLinks || []).map(Mapper.From.RelationLink),
				groupOrder: (obj.groupOrders || []).map(Mapper.From.GroupOrder),
				objectOrder: (obj.objectOrders || []).map(Mapper.From.ObjectOrder),
				targetObjectId: obj.TargetObjectId,
				isCollection: obj.isCollection,
			};
		},

		BlockRelation: (obj: any) => {
			return {
				key: obj.key,
			};
		},

		BlockLatex: (obj: any) => {
			return {
				text: obj.text,
				processor: obj.processor,
			};
		},

		BlockTableOfContents: () => {
			return {};
		},

		BlockTable: () => {
			return {};
		},

		BlockTableColumn: () => {
			return {};
		},

		BlockTableRow: (obj: any) => {
			return {
				isHeader: obj.isHeader,
			};
		},

		BlockWidget: (obj: any) => {
			return {
				layout: obj.layout,
				limit: obj.limit,
				viewId: obj.viewId,
				autoAdded: obj.autoAdded,
			};
		},

		BlockChat: () => {
			return {};
		},

		Block: (obj: any): I.Block => {
			let type = I.BlockType.Empty;
			let contentObj = {};

			for (const prop in PROP_TO_BLOCK_TYPE) {
				if (obj[prop] !== undefined) {
					type = PROP_TO_BLOCK_TYPE[prop];
					contentObj = obj[prop];
					break;
				};
			};

			const fm = U.String.toUpperCamelCase(`block-${type}`);
			const item: I.Block = {
				id: obj.id,
				type: type,
				childrenIds: obj.childrenIds || [],
				fields: Decode.struct(obj.fields) || {},
				hAlign: obj.align as number,
				vAlign: obj.verticalAlign as number,
				bgColor: obj.backgroundColor,
				content: {},
			};

			if (Mapper.From[fm]) {
				item.content = Mapper.From[fm](contentObj);
			} else {
				console.log('[Mapper] From does not exist: ', fm);
			};
			return item;
		},

		Restrictions: (obj: any): any => {
			return {
				object: obj ? obj.object || [] : [],
				dataview: obj ? (obj.dataview || []).map(Mapper.From.RestrictionsDataview) : [],
			};
		},

		RestrictionsDataview: (obj: any): any => {
			return {
				blockId: obj.blockId,
				restrictions: obj.restrictions || [],
			};
		},

		RelationLink: (obj: any): any => {
			return {
				relationKey: obj.key,
				format: obj.format,
			};
		},

		View: (obj: any): I.View => {
			return Object.assign({
				id: obj.id,
				sorts: (obj.sorts || []).map(Mapper.From.Sort),
				filters: (obj.filters || []).map(Mapper.From.Filter),
				relations: (obj.relations || []).map(Mapper.From.ViewRelation),
			}, Mapper.From.ViewFields(obj));
		},

		ViewFields: (obj: any): any => {
			return {
				type: obj.type,
				name: obj.name,
				coverRelationKey: obj.coverRelationKey,
				coverFit: obj.coverFit,
				cardSize: obj.cardSize,
				hideIcon: obj.hideIcon,
				groupRelationKey: obj.groupRelationKey,
				endRelationKey: obj.endRelationKey,
				wrapContent: obj.wrapContent,
				listSize: obj.listSize,
				groupBackgroundColors: obj.groupBackgroundColors,
				pageLimit: obj.pageLimit,
				defaultTemplateId: obj.defaultTemplateId,
				defaultTypeId: obj.defaultObjectTypeId,
			};
		},

		ViewRelation: (obj: any) => {
			return {
				relationKey: obj.key,
				isVisible: obj.isVisible,
				width: obj.width,
				formulaType: obj.formula,
				align: obj.align,
			};
		},

		Filter: (obj: any): I.Filter => {
			return {
				id: obj.id,
				relationKey: obj.RelationKey,
				operator: obj.operator as number,
				condition: obj.condition as number,
				quickOption: obj.quickOption as number,
				value: (obj.value !== undefined) ? Decode.value(obj.value) : null,
				nestedFilters: (obj.nestedFilters || []).map(Mapper.From.Filter),
			};
		},

		Sort: (obj: any): I.Sort => {
			return {
				id: obj.id,
				relationKey: obj.RelationKey,
				type: obj.type as number,
				customOrder: (obj.customOrder || []).map(Decode.value),
				empty: obj.emptyPlacement as number,
			};
		},

		HistoryVersion: (obj: any): I.HistoryVersion => {
			return {
				id: obj.id,
				authorId: obj.authorId,
				groupId: obj.groupId,
				time: obj.time,
			};
		},

		GraphEdge: (obj: any) => {
			return {
				type: obj.type,
				source: obj.source,
				target: obj.target,
				name: obj.name,
				description: obj.description,
				iconImage: obj.iconImage,
				iconEmoji: obj.iconEmoji,
				isHidden: obj.hidden,
			};
		},

		UnsplashPicture: (obj: any) => {
			return {
				id: obj.id,
				url: obj.url,
				artist: obj.artist,
				artistUrl: obj.artistUrl,
			};
		},

		ObjectView: (obj: any) => {
			return {
				rootId: obj.rootId,
				blocks: (obj.blocks || []).map(Mapper.From.Block),
				details: (obj.details || []).map(Mapper.From.Details),
				restrictions: Mapper.From.Restrictions(obj.restrictions),
				participants: (obj.blockParticipants || []).map((it: any) => ({
					blockId: it.blockId,
					participantId: it.participantId,
				})),
			};
		},

		BoardGroup: (obj: any): I.BoardGroup => {
			const type = Mapper.BoardGroupType(obj);

			let field = null;
			if (type) {
				field = obj[type];
			};

			let value: any = null;
			if (field) {
				switch (type) {
					case 'status':	 value = field.id; break;
					case 'tag':		 value = field.ids; break;
					case 'checkbox': value = field.checked; break;
				};
			};

			return {
				id: obj.id,
				value,
			};
		},

		GroupOrder: (obj: any) => {
			return {
				viewId: obj.viewId,
				groups: (obj.viewGroups || []).map((it: any) => {
					return {
						groupId: it.groupId,
						index: it.index,
						isHidden: it.hidden,
						bgColor: it.backgroundColor,
					};
				}),
			};
		},

		ObjectOrder: (obj: any) => {
			return {
				viewId: obj.viewId,
				groupId: obj.groupId,
				objectIds: obj.objectIds || [],
			};
		},

		ObjectSearchWithMeta: (obj: any) => {
			return {
				...Decode.struct(obj.details),
				metaList: (obj.meta || []).map(Mapper.From.MetaList),
			};
		},

		Notification: (obj: any): I.Notification => {
			const type = Mapper.NotificationPayload(obj);
			const field = type ? obj[type] : null;

			let payload: any = {};

			if (field) {
				switch (type) {

					case I.NotificationType.Import:
					case I.NotificationType.Gallery: {
						payload = Object.assign(payload, {
							processId: field.processId,
							errorCode: field.errorCode,
							spaceId: field.spaceId,
							name: field.name,
						});

						if (type === I.NotificationType.Import) {
							payload.importType = field.importType;
						};

						if (type === I.NotificationType.Gallery) {
							payload.spaceName = field.spaceName;
						};
						break;
					};

					case I.NotificationType.Export: {
						payload = Object.assign(payload, {
							errorCode: field.errorCode,
							exportType: field.exportType,
						});
						break;
					};

					case I.NotificationType.Join:
					case I.NotificationType.Remove: {
						payload = Object.assign(payload, {
							spaceId: field.spaceId,
							spaceName: field.spaceName,
							identity: field.identity,
							identityName: field.identityName,
							identityIcon: field.identityIcon,
						});
						break;
					};

					case I.NotificationType.Permission:
					case I.NotificationType.Approve: {
						payload = Object.assign(payload, {
							spaceId: field.spaceId,
							spaceName: field.spaceName,
							permissions: field.permissions,
						});
						break;
					};

					case I.NotificationType.Decline: {
						payload = Object.assign(payload, {
							spaceId: field.spaceId,
							spaceName: field.spaceName,
						});
						break;
					};

				};
			};

			return {
				id: obj.id,
				createTime: obj.createTime,
				status: obj.status as number,
				isLocal: obj.isLocal,
				type: type as I.NotificationType,
				payload,
			};
		},

		Manifest: (obj: any) => {
			return {
				id: obj.id,
				schema: obj.schema,
				name: obj.name,
				author: obj.author,
				license: obj.license,
				title: obj.title,
				description: obj.description,
				downloadLink: obj.downloadLink,
				size: obj.fileSize,
				screenshots: obj.screenshots || [],
				categories: obj.categories || [],
			};
		},

		MembershipAmount: (obj: any): I.MembershipAmount => {
			return {
				currency: obj.currency,
				amountCents: obj.amountCents,
			};
		},

		MembershipProduct: (obj: any): I.MembershipProduct => {
			const features = obj.features || {};

			return {
				id: obj.id,
				name: obj.name,
				description: obj.description,
				isTopLevel: obj.isTopLevel,
				isIntro: obj.isIntro,
				isHidden: obj.isHidden,
				color: obj.colorStr,
				offer: obj.offer,
				pricesYearly: (obj.pricesYearly || []).map(Mapper.From.MembershipAmount),
				pricesMonthly: (obj.pricesMonthly || []).map(Mapper.From.MembershipAmount),
				pricesLifetime: (obj.pricesLifetime || []).map(Mapper.From.MembershipAmount),
				features: {
					storageBytes: features.storageBytes,
					spaceReaders: features.spaceReaders,
					spaceWriters: features.spaceWriters,
					sharedSpaces: features.sharedSpaces,
					privateSpaces: features.privateSpaces,
					teamSeats: features.teamSeats,
					anyNameCount: features.anyNameCount,
					anyNameMinLen: features.anyNameMinLen,
				},
			};
		},

		MembershipData: (obj: any): I.MembershipData => {
			const invoice = obj.nextInvoice;

			const ret: any = {
				products: (obj.products || []).map((it: any) => {
					const info = it.purchaseInfo || {};

					return {
						product: Mapper.From.MembershipProduct(it.product || {}),
						info: {
							dateStarted: info.dateStarted,
							dateEnds: info.dateEnds,
							isAutoRenew: info.isAutoRenew,
							period: info.period,
						},
						status: (it.productStatus || {}).status as number,
					};
				}),
				teamOwnerId: obj.teamOwnerID,
				paymentProvider: obj.paymentProvider as number,
			};

			if (invoice) {
				ret.nextInvoice = {
					date: invoice.date,
					total: invoice.total ? Mapper.From.MembershipAmount(invoice.total) : null,
				};
			};

			return ret;
		},

		Process: (obj: any) => {
			const type = Mapper.ProcessType(obj);

			return {
				id: obj.id,
				state: obj.state as number,
				type,
				spaceId: obj.spaceId,
				progress: Mapper.From.Progress(obj.progress || {}),
				error: obj.error,
			};
		},

		Progress: (obj: any) => {
			return {
				done: obj.done,
				total: obj.total,
				message: obj.message,
			};
		},

		MetaList: (obj: any): any => {
			return {
				highlight: obj.highlight,
				blockId: obj.blockId,
				relationKey: obj.relationKey,
				relationDetails: Decode.struct(obj.relationDetails),
				ranges: (obj.highlightRanges || []).map(Mapper.From.Range),
			};
		},

		DeviceInfo: (obj: any): any => {
			return {
				id: obj.id,
				name: obj.name,
				addDate: obj.addDate,
				isConnected: obj.isConnected,
				archived: obj.archived,
			};
		},

		ChatMessage: (obj: any): Partial<I.ChatMessage> => {
			return {
				id: obj.id,
				orderId: obj.orderId,
				creator: obj.creator,
				createdAt: obj.createdAt,
				modifiedAt: obj.modifiedAt,
				replyToMessageId: obj.replyToMessageId,
				content: Mapper.From.ChatMessageContent(obj.message || {}),
				attachments: (obj.attachments || []).map(Mapper.From.ChatMessageAttachment),
				reactions: Mapper.From.ChatMessageReaction(obj.reactions),
				blocks: (obj.blocks || []).map(Mapper.From.ChatMessageBlock),
				isReadMessage: obj.read,
				isReadMention: obj.mentionRead,
				isReadReaction: !obj.unreadReaction,
				hasMention: obj.hasMention,
				isSynced: obj.synced,
				isPinned: obj.pinned,
			};
		},

		ChatState: (obj: any): I.ChatState => {
			return {
				messages: Mapper.From.ChatStateUnreadMessages(obj.messages || {}),
				mentions: Mapper.From.ChatStateUnreadMessages(obj.mentions || {}),
				reactionOrderId: obj.unreadReactionOrderId,
				lastStateId: obj.lastStateId,
				order: obj.order,
			};
		},

		ChatPreview: (obj: any): any => {
			const dependencies = new Map((obj.dependencies || []).map((dep: any) => {
				const decoded: any = Decode.struct(dep);
				return [ decoded.id, decoded ];
			}));

			return {
				spaceId: obj.spaceId,
				chatId: obj.chatObjectId,
				message: obj.message ? Mapper.From.ChatMessage(obj.message) : null,
				state: obj.state ? Mapper.From.ChatState(obj.state) : null,
				dependencies,
			};
		},

		ChatStateUnreadMessages (obj: any): I.ChatStateCounter {
			return {
				orderId: obj.oldestOrderId,
				counter: obj.counter,
			};
		},

		ChatMessageContent (obj: any): I.ChatMessageContent {
			return {
				text: obj.text,
				style: obj.style as number,
				marks: (obj.marks || []).map(Mapper.From.Mark),
			};
		},

		ChatMessageBlock (obj: any): I.ChatMessageBlock {
			const result: I.ChatMessageBlock = {};

			if (obj.text !== undefined) {
				result.text = Mapper.From.ChatMessageBlockText(obj.text);
			};

			if (obj.link !== undefined) {
				result.link = Mapper.From.ChatMessageBlockLink(obj.link);
			};

			if (obj.embed !== undefined) {
				result.embed = Mapper.From.ChatMessageBlockEmbed(obj.embed);
			};

			if (obj.editorQuote !== undefined) {
				result.editorQuote = Mapper.From.ChatMessageBlockEditorQuote(obj.editorQuote);
			};

			if (obj.messageQuote !== undefined) {
				result.messageQuote = Mapper.From.ChatMessageBlockMessageQuote(obj.messageQuote);
			};

			return result;
		},

		ChatMessageBlockText (obj: any): I.ChatMessageBlockText {
			return {
				text: obj.text,
				style: obj.style as number,
				marks: (obj.marks || []).map(Mapper.From.Mark),
				checked: obj.checked,
				lang: obj.lang,
			};
		},

		ChatMessageBlockEmbed (obj: any): I.ChatMessageBlockEmbed {
			return {
				text: obj.text,
				processor: obj.processor as number,
			};
		},

		ChatMessageBlockLink (obj: any): I.ChatMessageBlockLink {
			return {
				targetObjectId: obj.targetObjectId,
				type: obj.type as number,
			};
		},

		ChatMessageBlockEditorQuote (obj: any): I.ChatMessageBlockEditorQuote {
			return {
				blockId: obj.blockId || '',
				content: Mapper.From.ChatMessageBlockText(obj.content || {}),
			};
		},

		ChatMessageBlockMessageQuote (obj: any): I.ChatMessageBlockMessageQuote {
			return {
				messageId: obj.messageId || '',
				content: Mapper.From.ChatMessageBlockText(obj.content || {}),
			};
		},

		ChatMessageAttachment (obj: any): I.ChatMessageAttachment {
			return {
				target: obj.target,
				type: obj.type as number,
			};
		},

		ChatMessageReaction (obj: any): I.ChatMessageReaction[] {
			const reactions = [];
			const map = obj?.reactions || {};

			for (const [ emoji, identityList ] of Object.entries(map)) {
				reactions.push({ icon: emoji, authors: (identityList as { ids: string[] })?.ids || [] });
			};

			return reactions;
		},

		ChatSearchResult: (obj: any): any => {
			return {
				chatId: obj.chatId,
				messageId: obj.messageId,
				score: obj.score,
				highlight: obj.highlight,
				highlightRanges: (obj.highlightRanges || []).map(Mapper.From.Range),
				message: obj.message ? Mapper.From.ChatMessage(obj.message) : null,
			};
		},

		PublishState: (obj: any): any => {
			return {
				spaceId: obj.spaceId,
				objectId: obj.objectId,
				uri: obj.uri,
				status: obj.status as number,
				version: obj.version,
				timestamp: obj.timestamp,
				size: obj.size,
				details: Decode.struct(obj.details),
				joinSpace: obj.joinSpace,
			};
		},

		AppInfo: (obj: any): I.AppInfo => {
			return {
				hash: obj.appHash,
				apiKey: obj.appKey,
				name: obj.appName,
				createdAt: obj.createdAt,
				expireAt: obj.expireAt,
				scope: obj.scope as number,
				isActive: obj.isActive,
			};
		},

	},

	//------------------------------------------------------------

	/**
	 * To: Converters for transforming TypeScript objects TO protobuf messages.
	 * With ts-proto, these return plain objects matching the protobuf interface shape.
	 */
	To: {

		Range: (obj: any) => {
			return {
				from: Number(obj.from || 0),
				to: Number(obj.to || 0),
			};
		},

		Mark: (obj: any) => {
			return {
				type: Number(obj.type || 0),
				param: String(obj.param || ''),
				range: Mapper.To.Range(obj.range),
			};
		},

		Details: (obj: any) => {
			return {
				key: String(obj.key || ''),
				value: Encode.value(obj.value),
			};
		},

		Fields: (obj: any) => {
			return {
				blockId: String(obj.blockId || ''),
				fields: Encode.struct(obj.fields || {}),
			};
		},

		BlockFeatured: () => {
			return {};
		},

		BlockLayout: (obj: any) => {
			return {
				style: Number(obj.style || 0),
			};
		},

		BlockText: (obj: any) => {
			const marks = (obj.marks || []).map(Mapper.To.Mark);

			return {
				text: String(obj.text || ''),
				style: Number(obj.style || 0),
				checked: Boolean(obj.checked),
				color: String(obj.color || ''),
				marks: { marks },
				iconEmoji: String(obj.iconEmoji || ''),
				iconImage: String(obj.iconImage || ''),
			};
		},

		BlockFile: (obj: any) => {
			return {
				targetObjectId: String(obj.targetObjectId || ''),
				type: Number(obj.type || 0),
				addedAt: Number(obj.addedAt || 0),
				state: Number(obj.state || 0),
				style: Number(obj.style || 0),
			};
		},

		BlockBookmark: (obj: any) => {
			return {
				targetObjectId: String(obj.targetObjectId || ''),
				state: Number(obj.state || 0),
				url: String(obj.url || ''),
			};
		},

		BlockLink: (obj: any) => {
			return {
				targetBlockId: String(obj.targetBlockId || ''),
				iconSize: Number(obj.iconSize || 0),
				cardStyle: Number(obj.cardStyle || 0),
				description: Number(obj.description || 0),
				relations: obj.relations || [],
			};
		},

		BlockDiv: (obj: any) => {
			return {
				style: Number(obj.style || 0),
			};
		},

		BlockRelation: (obj: any) => {
			return {
				key: String(obj.key || ''),
			};
		},

		BlockLatex: (obj: any) => {
			return {
				text: String(obj.text || ''),
				processor: Number(obj.processor || 0),
			};
		},

		BlockDataview: (obj: any) => {
			return {
				TargetObjectId: String(obj.targetObjectId || ''),
				isCollection: Boolean(obj.isCollection),
				views: (obj.views || []).map(Mapper.To.View),
			};
		},

		BlockTable: () => {
			return {};
		},

		BlockTableRow: (obj: any) => {
			return {
				isHeader: Boolean(obj.isHeader),
			};
		},

		BlockTableColumn: () => {
			return {};
		},

		BlockTableOfContents: () => {
			return {};
		},

		BlockWidget: (obj: any) => {
			return {
				layout: Number(obj.layout || 0),
				limit: Number(obj.limit || 0),
				viewId: String(obj.viewId || ''),
			};
		},

		BlockChat: (obj: any) => {
			return {};
		},

		Block: (obj: any) => {
			obj = obj || {};
			obj.type = String(obj.type || I.BlockType.Empty);
			obj.content = U.Common.objectCopy(obj.content || {});

			const fm = U.String.toUpperCamelCase(`block-${obj.type}`);
			const contentKey = BLOCK_TYPE_TO_PROP[obj.type];

			const block: any = {
				id: String(obj.id || ''),
				align: Number(obj.hAlign || 0),
				verticalAlign: Number(obj.vAlign || 0),
				backgroundColor: String(obj.bgColor || ''),
				childrenIds: obj.childrenIds || [],
				fields: obj.fields ? Encode.struct(obj.fields || {}) : undefined,
			};

			if (contentKey && Mapper.To[fm]) {
				block[contentKey] = Mapper.To[fm](obj.content);
			} else {
				console.log('[Mapper] Block content key or To method do not exist: ', contentKey, fm);
			};

			return block;
		},

		ViewRelation: (obj: any) => {
			return {
				key: obj.relationKey,
				isVisible: obj.isVisible,
				width: obj.width,
				formula: obj.formulaType,
				align: obj.align as number,
			};
		},

		Filter: (obj: any) => {
			return {
				id: obj.id || '',
				RelationKey: obj.relationKey || '',
				format: obj.format || 0,
				operator: obj.operator || 0,
				condition: obj.condition || 0,
				quickOption: obj.quickOption || 0,
				value: Encode.value(obj.value),
				includeTime: obj.includeTime || false,
				nestedFilters: (obj.nestedFilters || []).map(Mapper.To.Filter),
			};
		},

		Sort: (obj: any) => {
			return {
				id: obj.id || '',
				RelationKey: obj.relationKey || '',
				type: obj.type || 0,
				customOrder: (obj.customOrder || []).map(Encode.value),
				format: obj.format || 0,
				includeTime: obj.includeTime || false,
				emptyPlacement: obj.empty || 0,
			};
		},

		View: (obj: I.View) => {
			obj = new M.View(U.Common.objectCopy(obj));

			return {
				id: obj.id,
				name: obj.name,
				type: obj.type as number,
				coverRelationKey: obj.coverRelationKey,
				groupRelationKey: obj.groupRelationKey,
				endRelationKey: obj.endRelationKey,
				wrapContent: obj.wrapContent,
				listSize: obj.listSize as number,
				groupBackgroundColors: obj.groupBackgroundColors,
				coverFit: obj.coverFit,
				cardSize: obj.cardSize as number,
				hideIcon: obj.hideIcon,
				pageLimit: obj.pageLimit,
				relations: obj.relations.map(Mapper.To.ViewRelation),
				filters: obj.filters.map(Mapper.To.Filter),
				sorts: obj.sorts.map(Mapper.To.Sort),
				defaultTemplateId: obj.defaultTemplateId,
				defaultObjectTypeId: obj.defaultTypeId,
			};
		},

		PasteFile: (obj: any) => {
			return {
				name: obj.name,
				localPath: obj.path,
			};
		},

		GroupOrder: (obj: any) => {
			return {
				viewId: obj.viewId,
				viewGroups: obj.groups.map((it: any) => {
					return {
						groupId: it.groupId,
						index: it.index,
						hidden: it.isHidden,
						backgroundColor: it.bgColor,
					};
				}),
			};
		},

		ObjectOrder: (obj: any) => {
			return {
				viewId: obj.viewId,
				groupId: obj.groupId,
				objectIds: obj.objectIds,
			};
		},

		InternalFlag: (value: I.ObjectFlag) => {
			return {
				value: value as number,
			};
		},

		Snapshot: (obj: any) => {
			return {
				id: obj.id,
				snapshot: obj.snapshot,
			};
		},

		ParticipantPermissionChange: (obj: any) => {
			return {
				identity: obj.identity,
				perms: obj.permissions,
			};
		},

		ChatMessage: (obj: I.ChatMessage) => {
			const item: any = {
				id: obj.id,
				orderId: obj.orderId || '',
				creator: obj.creator || '',
				createdAt: obj.createdAt || 0,
				modifiedAt: obj.modifiedAt || 0,
				replyToMessageId: obj.replyToMessageId || '',
				message: Mapper.To.ChatMessageContent(obj.content),
				attachments: (obj.attachments || []).map(Mapper.To.ChatMessageAttachment),
				reactions: Mapper.To.ChatMessageReaction(obj.reactions),
			};

			if (obj.blocks && obj.blocks.length) {
				item.blocks = obj.blocks.map(Mapper.To.ChatMessageBlock);
			};

			item.pinned = obj.isPinned;

			return item;
		},

		ChatMessageContent: (obj: I.ChatMessageContent) => {
			return {
				text: obj.text,
				style: obj.style as number,
				marks: obj.marks.map(Mapper.To.Mark),
			};
		},

		ChatMessageBlock: (obj: I.ChatMessageBlock) => {
			const item: any = {};

			if (obj.text) {
				item.text = Mapper.To.ChatMessageBlockText(obj.text);
			};

			if (obj.link) {
				item.link = Mapper.To.ChatMessageBlockLink(obj.link);
			};

			if (obj.embed) {
				item.embed = Mapper.To.ChatMessageBlockEmbed(obj.embed);
			};

			if (obj.editorQuote) {
				item.editorQuote = Mapper.To.ChatMessageBlockEditorQuote(obj.editorQuote);
			};

			if (obj.messageQuote) {
				item.messageQuote = Mapper.To.ChatMessageBlockMessageQuote(obj.messageQuote);
			};

			return item;
		},

		ChatMessageBlockText: (obj: I.ChatMessageBlockText) => {
			const item: any = {
				text: obj.text,
				style: obj.style as number,
				marks: (obj.marks || []).map(Mapper.To.Mark),
			};

			if (obj.checked) {
				item.checked = obj.checked;
			};

			if (obj.lang) {
				item.lang = obj.lang;
			};

			return item;
		},

		ChatMessageBlockLink: (obj: I.ChatMessageBlockLink) => {
			return {
				targetObjectId: obj.targetObjectId,
				type: obj.type as number,
			};
		},

		ChatMessageBlockEditorQuote: (obj: I.ChatMessageBlockEditorQuote) => {
			return {
				blockId: obj.blockId || '',
				content: Mapper.To.ChatMessageBlockText(obj.content),
			};
		},

		ChatMessageBlockMessageQuote: (obj: I.ChatMessageBlockMessageQuote) => {
			return {
				messageId: obj.messageId || '',
				content: Mapper.To.ChatMessageBlockText(obj.content),
			};
		},

		ChatMessageBlockEmbed: (obj: I.ChatMessageBlockEmbed) => {
			return {
				text: obj.text,
				processor: obj.processor as number,
			};
		},

		ChatMessageAttachment: (obj: I.ChatMessageAttachment) => {
			return {
				target: obj.target,
				type: obj.type as number,
			};
		},

		ChatMessageReaction: (map: any) => {
			const reactions: Record<string, any> = {};

			(map || []).forEach((it: any) => {
				reactions[it.icon] = { ids: it.authors };
			});

			return { reactions };
		},

		AppInfo: (obj: any) => {
			return {
				appName: obj.name,
				scope: obj.scope as number,
			};
		},

		SearchSort: (obj: any): any => {
			return {
				key: obj.key,
				type: obj.type as number,
			};
		},

	},

	/**
	 * Event: Specialized mappers for processing real-time events from middleware.
	 * These handle the conversion of streaming event messages.
	 *
	 * - Type(): Detects event type from ts-proto optional message properties
	 * - Data(): Extracts event type and data from a message
	 * - [EventName](): Individual event type processors
	 */
	Event: {

		/**
		 * Detect event type by checking which optional property is set on the message.
		 */
		Type (message: any): string {
			for (const prop of Object.keys(message)) {
				if (!EVENT_SKIP_KEYS.has(prop) && (message[prop] !== undefined)) {
					return eventType(prop);
				};
			};
			return '';
		},

		/**
		 * Extract event type and data from a ts-proto Event_Message.
		 */
		Data (message: any): { type: string; data: any } {
			for (const prop of Object.keys(message)) {
				if (!EVENT_SKIP_KEYS.has(prop) && (message[prop] !== undefined)) {
					return { type: eventType(prop), data: message[prop] };
				};
			};
			return { type: '', data: {} };
		},

		AccountShow: (obj: any) => {
			return {
				account: Mapper.From.Account(obj.account || {}),
			};
		},

		DebugProfileCreated: (obj: any) => {
			return {
				reason: String(obj.reason || ''),
				jsonInfo: String(obj.jsonInfo || ''),
				path: String(obj.path || ''),
				full: Boolean(obj.full),
			};
		},

		AccountUpdate: (obj: any) => {
			return {
				status: Mapper.From.AccountStatus(obj.status || {}),
			};
		},

		AccountConfigUpdate: (obj: any) => {
			return {
				config: Mapper.From.AccountConfig(obj.config || {}),
			};
		},

		AccountLinkChallenge: (obj: any) => {
			return {
				challenge: obj.challenge,
			};
		},

		AccountLinkChallengeHide: (obj: any) => {
			return {
				challenge: obj.challenge,
			};
		},

		ObjectRelationsAmend: (obj: any) => {
			return {
				id: obj.id,
				relations: (obj.relationLinks || []).map(Mapper.From.RelationLink),
			};
		},

		ObjectRelationsRemove: (obj: any) => {
			return {
				id: obj.id,
				relationKeys: obj.relationKeys || [],
			};
		},

		ObjectRestrictionsSet: (obj: any) => {
			return {
				restrictions: Mapper.From.Restrictions(obj.restrictions),
			};
		},

		FileSpaceUsage: (obj: any) => {
			return {
				spaceId: obj.spaceId,
				bytesUsage: obj.bytesUsage,
			};
		},

		FileLocalUsage: (obj: any) => {
			return {
				localUsage: obj.localBytesUsage,
			};
		},

		FileLimitUpdated: (obj: any) => {
			return {
				bytesLimit: obj.bytesLimit,
			};
		},

		BlockAdd: (obj: any) => {
			return {
				blocks: (obj.blocks || []).map(Mapper.From.Block),
			};
		},

		BlockDelete: (obj: any) => {
			return {
				blockIds: obj.blockIds || [],
			};
		},

		BlockSetChildrenIds: (obj: any) => {
			return {
				id: obj.id,
				childrenIds: obj.childrenIds || [],
			};
		},

		BlockSetFields: (obj: any) => {
			return {
				id: obj.id,
				fields: obj.fields ? Decode.struct(obj.fields) : {},
			};
		},

		BlockSetLink: (obj: any) => {
			return {
				id: obj.id,
				targetBlockId: obj.targetBlockId ? obj.targetBlockId.value : null,
				cardStyle: obj.cardStyle ? obj.cardStyle.value : null,
				iconSize: obj.iconSize ? obj.iconSize.value : null,
				description: obj.description ? obj.description.value : null,
				relations: obj.relations ? obj.relations.value || [] : null,
				fields: obj.fields ? Decode.struct(obj.fields.value) : null,
			};
		},

		BlockSetText: (obj: any) => {
			return {
				id: obj.id,
				text: obj.text ? obj.text.value : null,
				style: obj.style ? obj.style.value : null,
				checked: obj.checked ? obj.checked.value : null,
				color: obj.color ? obj.color.value : null,
				iconEmoji: obj.iconEmoji ? obj.iconEmoji.value : null,
				iconImage: obj.iconImage ? obj.iconImage.value : null,
				marks: obj.marks ? (obj.marks.value?.marks || []).map(Mapper.From.Mark) : null,
			};
		},

		BlockSetDiv: (obj: any) => {
			return {
				id: obj.id,
				style: obj.style ? obj.style.value : null,
			};
		},

		BlockDataviewTargetObjectIdSet: (obj: any) => {
			return {
				id: obj.id,
				targetObjectId: obj.targetObjectId,
			};
		},

		BlockDataviewIsCollectionSet: (obj: any) => {
			return {
				id: obj.id,
				isCollection: obj.value,
			};
		},

		BlockSetWidget: (obj: any) => {
			return {
				id: obj.id,
				layout: obj.layout ? obj.layout.value : null,
				limit: obj.limit ? obj.limit.value : null,
				viewId: obj.viewId ? obj.viewId.value : null,
			};
		},

		BlockSetFile: (obj: any) => {
			return {
				id: obj.id,
				targetObjectId: obj.targetObjectId ? obj.targetObjectId.value : null,
				type: obj.type ? obj.type.value : null,
				style: obj.style ? obj.style.value : null,
				state: obj.state ? obj.state.value : null,
			};
		},

		BlockSetBookmark: (obj: any) => {
			return {
				id: obj.id,
				targetObjectId: obj.targetObjectId ? obj.targetObjectId.value : null,
				state: obj.state ? obj.state.value : null,
			};
		},

		BlockSetBackgroundColor: (obj: any) => {
			return {
				id: obj.id,
				bgColor: obj.backgroundColor,
			};
		},

		BlockSetAlign: (obj: any) => {
			return {
				id: obj.id,
				align: obj.align,
			};
		},

		BlockSetVerticalAlign: (obj: any) => {
			return {
				id: obj.id,
				align: obj.verticalAlign,
			};
		},

		BlockSetRelation: (obj: any) => {
			return {
				id: obj.id,
				key: obj.key ? obj.key.value : null,
			};
		},

		BlockSetLatex: (obj: any) => {
			return {
				id: obj.id,
				text: obj.text ? obj.text.value : null,
			};
		},

		BlockSetTableRow: (obj: any) => {
			return {
				id: obj.id,
				isHeader: obj.isHeader ? obj.isHeader.value : null,
			};
		},

		BlockDataviewViewSet: (obj: any) => {
			return {
				id: obj.id,
				view: Mapper.From.View(obj.view || {}),
			};
		},

		BlockDataviewViewUpdate: (obj: any) => {
			const ret: any = {
				id: obj.id,
				viewId: obj.viewId,
				fields: obj.fields ? Mapper.From.ViewFields(obj.fields) : null,
			};

			const keys = [
				{ id: 'filter', field: 'filters', mapper: 'Filter' },
				{ id: 'sort', field: 'sorts', mapper: 'Sort' },
				{ id: 'relation', field: 'relations', mapper: 'ViewRelation' },
			];

			keys.forEach(key => {
				const items = obj[key.id] || [];

				ret[key.field] = [];

				items.forEach((item: any) => {
					if (item.add !== undefined) {
						const op = item.add;
						const afterId = op.afterId;
						const items = (op.items || []).map(Mapper.From[key.mapper]);

						ret[key.field].push({ add: { afterId, items } });
					};

					if (item.move !== undefined) {
						const op = item.move;
						const afterId = op.afterId;
						const ids = op.ids || [];

						ret[key.field].push({ move: { afterId, ids } });
					};

					if (item.update !== undefined) {
						const op = item.update;

						if (op.item !== undefined) {
							const item = Mapper.From[key.mapper](op.item);

							ret[key.field].push({ update: { id: op.id, item } });
						};
					};

					if (item.remove !== undefined) {
						const op = item.remove;
						const ids = op.ids || [];

						ret[key.field].push({ remove: { ids } });
					};
				});
			});

			return ret;
		},

		BlockDataviewViewDelete: (obj: any) => {
			return {
				id: obj.id,
				viewId: obj.viewId,
			};
		},

		BlockDataviewViewOrder: (obj: any) => {
			return {
				id: obj.id,
				viewIds: obj.viewIds || [],
			};
		},

		BlockDataviewRelationDelete: (obj: any) => {
			return {
				id: obj.id,
				relationKeys: obj.relationKeys || [],
			};
		},

		BlockDataviewRelationSet: (obj: any) => {
			return {
				id: obj.id,
				relations: (obj.relationLinks || []).map(Mapper.From.RelationLink),
			};
		},

		BlockDataViewGroupOrderUpdate: (obj: any) => {
			return {
				id: obj.id,
				groupOrder: obj.groupOrder ? Mapper.From.GroupOrder(obj.groupOrder) : null,
			};
		},

		BlockDataViewObjectOrderUpdate: (obj: any) => {
			return {
				id: obj.id,
				groupId: obj.groupId,
				viewId: obj.viewId,
				changes: (obj.sliceChanges || []).map((it: any) => {
					return {
						operation: it.op,
						ids: it.ids || [],
						afterId: it.afterId,
					};
				})
			};
		},

		ObjectDetailsSet: (obj: any) => {
			return {
				id: obj.id,
				subIds: obj.subIds || [],
				details: Decode.struct(obj.details),
			};
		},

		ObjectDetailsAmend: (obj: any) => {
			const details = {};

			(obj.details || []).forEach((it: any) => {
				details[it.key] = Decode.value(it.value);
			});

			return {
				id: obj.id,
				subIds: obj.subIds || [],
				details,
			};
		},

		ObjectDetailsUnset: (obj: any) => {
			return {
				id: obj.id,
				subIds: obj.subIds || [],
				keys: obj.keys || [],
			};
		},

		ObjectAutoArchive: (obj: any) => {
			return {
				objectIds: obj.objectIds || [],
			};
		},

		ObjectAutoRestore: (obj: any) => {
			return {
				objectIds: obj.objectIds || [],
			};
		},

		SubscriptionAdd: (obj: any) => {
			return {
				id: obj.id,
				afterId: obj.afterId,
				subId: obj.subId,
			};
		},

		SubscriptionRemove: (obj: any) => {
			return {
				id: obj.id,
				subId: obj.subId,
			};
		},

		SubscriptionPosition: (obj: any) => {
			return {
				id: obj.id,
				afterId: obj.afterId,
				subId: obj.subId,
			};
		},

		SubscriptionCounters: (obj: any) => {
			return {
				total: obj.total,
				subId: obj.subId,
			};
		},

		SubscriptionGroups: (obj: any) => {
			return {
				subId: obj.subId,
				group: Mapper.From.BoardGroup(obj.group || {}),
				remove: obj.remove,
			};
		},

		NotificationSend: (obj: any) => {
			return {
				notification: Mapper.From.Notification(obj.notification || {}),
			};
		},

		NotificationUpdate: (obj: any) => {
			return {
				notification: Mapper.From.Notification(obj.notification || {}),
			};
		},

		PayloadBroadcast: (obj: any) => {
			return {
				payload: obj.payload,
			};
		},

		ProcessNew: (obj: any) => {
			return {
				process: Mapper.From.Process(obj.process || {}),
			};
		},

		ProcessUpdate: (obj: any) => {
			return {
				process: Mapper.From.Process(obj.process || {}),
			};
		},

		ProcessDone: (obj: any) => {
			return {
				process: Mapper.From.Process(obj.process || {}),
			};
		},

		SpaceSyncStatusUpdate: (obj: any) => {
			return {
				id: obj.id,
				error: obj.error,
				network: obj.network,
				status: obj.status,
				syncingCounter: obj.syncingObjectsCounter,
				notSyncedCounter: obj.notSyncedFilesCounter,
			};
		},

		P2pStatusUpdate: (obj: any) => {
			return {
				id: obj.spaceId,
				p2p: obj.status,
				devicesCounter: obj.devicesCounter,
			};
		},

		ImportFinish: (obj: any) => {
			return {
				collectionId: obj.rootCollectionID,
				count: obj.objectsCount,
				type: obj.importType,
			};
		},

		ChatAdd: (obj: any) => {
			const dependencies = new Map((obj.dependencies || []).map((dep: any) => {
				const decoded: any = Decode.struct(dep);
				return [ decoded.id, decoded ];
			}));

			return {
				id: obj.id,
				orderId: obj.orderId,
				message: Mapper.From.ChatMessage(obj.message || {}),
				subIds: obj.subIds || [],
				dependencies,
			};
		},

		ChatUpdate: (obj: any) => {
			return {
				id: obj.id,
				message: Mapper.From.ChatMessage(obj.message || {}),
				subIds: obj.subIds || [],
			};
		},

		ChatDelete: (obj: any) => {
			return {
				id: obj.id,
				subIds: obj.subIds || [],
			};
		},

		ChatUpdateReactions: (obj: any) => {
			return {
				id: obj.id,
				reactions: Mapper.From.ChatMessageReaction(obj.reactions),
				subIds: obj.subIds || [],
			};
		},

		ChatStateUpdate: (obj: any) => {
			return {
				state: Mapper.From.ChatState(obj.state || {}),
				subIds: obj.subIds || [],
			};
		},

		ChatUpdateMessageReadStatus: (obj: any) => {
			return {
				ids: obj.ids || [],
				isRead: obj.isRead,
				subIds: obj.subIds || [],
			};
		},

		ChatUpdateMentionReadStatus: (obj: any) => {
			return {
				ids: obj.ids || [],
				isRead: obj.isRead,
				subIds: obj.subIds || [],
			};
		},

		ChatUpdateMessageSyncStatus: (obj: any) => {
			return {
				ids: obj.ids || [],
				isSynced: obj.isSynced,
				subIds: obj.subIds || [],
			};
		},

		ChatUpdatePinnedStatus: (obj: any) => {
			return {
				message: obj.message ? Mapper.From.ChatMessage(obj.message) : null,
				isPinned: obj.isPinned,
				subIds: obj.subIds || [],
			};
		},

		ChatUpdateReactionReadStatus: (obj: any) => {
			return {
				ids: obj.ids || [],
				isRead: !obj.isUnread,
				subIds: obj.subIds || [],
			};
		},

		MembershipV2Update: (obj: any) => {
			return {
				data: Mapper.From.MembershipData(obj.data || {}),
			};
		},

		MembershipV2ProductsUpdate: (obj: any) => {
			return {
				products: (obj.products || []).map(Mapper.From.MembershipProduct),
			};
		},

	},

};
