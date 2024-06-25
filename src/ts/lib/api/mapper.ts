import { I, M, U } from 'Lib';
import { Commands, Events, Model, Encode, Decode } from 'Lib/api/pb';

export const Mapper = {

	From: {

		Account: (obj: Model.Account): I.Account => {

			return {
				...obj,
				status: Mapper.From.AccountStatus(obj.status),
			};
		},

		AccountStatus: (obj: Model.Account_Status): I.AccountStatus => {
			return {
				type: obj.statusType as number,
				date: obj.deletionDate,
			};
		},
		
		ObjectInfo: (obj): I.PageInfo => {
			return {
				id: obj.getId(),
				details: Decode.struct(obj.getDetails()),
				snippet: obj.getSnippet(),
				hasInboundLinks: obj.getHasinboundlinks(),
			};
		},

		Record: (obj: any): any => {
			return Decode.struct(obj);
		},

		Mark: (obj: Model.Block_Content_Text_Mark): I.Mark => {
			return {
				type: obj.type as number,
				param: obj.param,
				range: obj.range,
			};
		},

		Details: (obj: Model.ObjectView_DetailsSet): any => {
			return {
				id: obj.id,
				details: Decode.struct(obj.details),
			};
		},

		BlockText: (obj: Model.Block_Content_Text) => {
			return {
				...obj,
				marks: (obj.marks.marks || []).map(Mapper.From.Mark),
			};
		},

		BlockDataview: (obj: Model.Block_Content_Dataview) => {
			return {
				sources: obj.source,
				viewId: obj.activeView,
				views: (obj.views || []).map(Mapper.From.View),
				relationLinks: (obj.relationLinks || []).map(Mapper.From.RelationLink),
				groupOrder: (obj.groupOrders || []).map(Mapper.From.GroupOrder),
				objectOrder: (obj.objectOrders || []).map(Mapper.From.ObjectOrder),
				targetObjectId: obj.targetObjectId,
				isCollection: obj.isCollection,
			};
		},

		Block: (obj: Model.Block): I.Block => {
			const type = obj.content.oneofKind;
			const fm = U.Common.toUpperCamelCase(`block-${type}`);
			const content = obj.content[type] ? obj.content[type]() : {};

			return {
				id: obj.id,
				type: type as I.BlockType,
				childrenIds: obj.childrenIds || [],
				fields: Decode.struct(obj.fields) || {},
				hAlign: obj.align as number,
				vAlign: obj.verticalAlign as number,
				bgColor: obj.backgroundColor,
				content: Mapper.From[fm] ? Mapper.From[fm](content) : content,
			};
		},

		Restrictions: (obj: any): any => {
			return {
				object: obj ? obj.getObjectList() || [] : [],
				dataview: obj ? (obj.getDataviewList() || []).map(Mapper.From.RestrictionsDataview) : [],
			};
		},

		RestrictionsDataview: (obj: any): any => {
			return {
				blockId: obj.getBlockid(),
				restrictions: obj.getRestrictionsList() || [],
			};
		},

		RelationLink: (obj: Model.RelationLink): any => {
			return {
				relationKey: obj.key,
				format: obj.format,
			};
		},

		View: (obj: Model.Block_Content_Dataview_View): I.View => {
			return Object.assign({
				id: obj.id,
				sorts: obj.sorts.map(Mapper.From.Sort),
				filters: obj.filters.map(Mapper.From.Filter),
				relations: obj.relations.map(Mapper.From.ViewRelation),
			}, Mapper.From.ViewFields(obj));
		},

		ViewFields: (obj: Events.Event_Block_Dataview_ViewUpdate_Fields): any => {
			return obj;
		},

		ViewRelation: (obj: Model.Block_Content_Dataview_Relation) => {
            return {
				...obj,
                relationKey: obj.key,
				includeTime: obj.dateIncludeTime,
            };
        },

		Filter: (obj: Model.Block_Content_Dataview_Filter): I.Filter => {
			return {
				id: obj.id,
				relationKey: obj.relationKey,
				operator: obj.operator as number,
				condition: obj.condition as number,
				quickOption: obj.quickOption as number,
				value: Decode.value(obj.value),
			};
		},

		Sort: (obj: Model.Block_Content_Dataview_Sort): I.Sort => {
			return {
				id: obj.id,
				relationKey: obj.relationKey,
				type: obj.type as number,
				customOrder: (obj.customOrder || []).map(Decode.value),
				empty: obj.emptyPlacement as number,
			};
		},

		GraphEdge: (obj: Commands.Rpc_Object_Graph_Edge) => {
            return {
				...obj,
				isHidden: obj.hidden,
            };
        },

		UnsplashPicture: (obj: Commands.Rpc_Unsplash_Search_Response_Picture) => {
			return {
                id: obj.id,
				url: obj.url,
				artist: obj.artist,
				artistUrl: obj.artistUrl,
            };
		},

		ObjectView: (obj: Model.ObjectView) => {
			return {
				rootId: obj.rootId,
				blocks: (obj.blocks || []).map(Mapper.From.Block),
				details: (obj.details || []).map(Mapper.From.Details),
				relationLinks: (obj.relationLinks || []).map(Mapper.From.RelationLink),
				restrictions: Mapper.From.Restrictions(obj.restrictions),
				participants: obj.blockParticipants,
			};
		},

		BoardGroup: (obj: Model.Block_Content_Dataview_Group): I.BoardGroup => {
			const type = obj.value.oneofKind;
			const field = obj.value[type];

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

		GroupOrder: (obj: Model.Block_Content_Dataview_GroupOrder) => {
			return {
				viewId: obj.viewId,
				groups: (obj.viewGroups || []).map((it: Model.Block_Content_Dataview_ViewGroup) => {
					return {
						...obj,
						isHidden: it.hidden,
						bgColor: it.backgroundColor,
					};
				}),
			};
		},

		ObjectOrder: (obj: Model.Block_Content_Dataview_ObjectOrder) => {
			return {
				viewId: obj.viewId,
				groupId: obj.groupId,
				objectIds: obj.objectIds,
			};
		},

		ObjectSearchWithMeta: (obj: any) => {
			return {
				...Decode.struct(obj.getDetails()),
				metaList: (obj.getMetaList() || []).map(Mapper.From.MetaList),
			};
		},

		Notification: (obj: Model.Notification): I.Notification => {
			const type = obj.payload.oneofKind;
			const fn = `get${U.Common.ucFirst(type)}`;
			const field = obj[fn] ? obj[fn]() : null;
			
			let payload: any = {};

			if (field) {
				switch (type) {

					case I.NotificationType.Import:
					case I.NotificationType.Gallery: {
						payload = Object.assign(payload, {
							processId: field.getProcessid(),
							errorCode: field.getErrorcode(),
							spaceId: field.getSpaceid(),
							name: field.getName(),
						});

						if (type == I.NotificationType.Import) {
							payload.importType = field.getImporttype();
						};

						if (type == I.NotificationType.Gallery) {
							payload.spaceName = field.getSpacename();
						};
						break;
					};

					case I.NotificationType.Export: {
						payload = Object.assign(payload, {
							errorCode: field.getErrorcode(),
							exportType: field.getExporttype(),
						});
						break;
					};

					case I.NotificationType.Join: 
					case I.NotificationType.Leave: 
					case I.NotificationType.Remove: {
						payload = Object.assign(payload, {
							spaceId: field.getSpaceid(),
							spaceName: field.getSpacename(),
							identity: field.getIdentity(),
							identityName: field.getIdentityname(),
							identityIcon: field.getIdentityicon(),
						});
						break;
					};

					case I.NotificationType.Permission:
					case I.NotificationType.Approve: {
						payload = Object.assign(payload, {
							spaceId: field.getSpaceid(),
							spaceName: field.getSpacename(),
							permissions: field.getPermissions(),
						});
						break;
					};

					case I.NotificationType.Decline: {
						payload = Object.assign(payload, {
							spaceId: field.getSpaceid(),
							spaceName: field.getSpacename(),
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

		Membership: (obj: Model.Membership): I.Membership => {
			return {
				tier: obj.tier,
				status: obj.status as number,
				dateStarted: obj.dateStarted,
				dateEnds: obj.dateEnds,
				isAutoRenew: obj.isAutoRenew,
				paymentMethod: obj.paymentMethod as number,
				name: obj.nsName,
				nameType: obj.nsNameType as number,
				userEmail: obj.userEmail,
				subscribeToNewsletter: obj.subscribeToNewsletter,	
			};
		},

		MembershipTierData: (obj: Model.MembershipTierData): I.MembershipTier => {
			return {
				id: obj.id,
				name: obj.name,
				description: obj.description,
				nameMinLength: obj.anyNameMinLength,
				isTest: obj.isTest,
				periodType: obj.periodType,
				period: obj.periodValue,
				priceCents: obj.priceStripeUsdCents,
				colorStr: obj.colorStr,
				features: obj.features,
				namesCount: obj.anyNamesCountIncluded,
			};
		},

		Process: (obj: Events.Model_Process) => {
			return {
				id: obj.id,
				state: obj.state as number,
				type: obj.type as number,
				progress: obj.progress,
			};
		},

		MetaList: (obj: Model.Search_Meta): any => {
			return {
				highlight: obj.highlight,
				blockId: obj.blockId,
				relationKey: obj.relationKey,
				relationDetails: Decode.struct(obj.relationDetails),
				ranges: obj.highlightRanges || [],
			};
		},

    },

	//------------------------------------------------------------

	To: {

		Range: (obj: Model.Range) => {
			return Model.Range.create(obj);
		},

		Mark: (obj: Model.Block_Content_Text_Mark) => {
			return Model.Block_Content_Text_Mark.create({
				...obj,
				range: Mapper.To.Range(obj.range),
			});
		},

		Details: (obj: Model.Detail) => {
			return Model.Detail.create(obj);
		},

		Fields: (obj: Commands.Rpc_Block_ListSetFields_Request_BlockField) => {
			return Commands.Rpc_Block_ListSetFields_Request_BlockField.create({
				blockId: obj.blockId,
				fields: Encode.struct(obj.fields || {}),
			});
		},

		BlockFeatured: (obj: Model.Block_Content_FeaturedRelations) => {
			return Model.Block_Content_FeaturedRelations.create(obj);
		},

		BlockLayout: (obj: Model.Block_Content_Layout) => {
			return Model.Block_Content_Layout.create(obj);
		},

		BlockText: (obj: any) => {
			obj.marks = Model.Block_Content_Text_Marks.create((obj.marks || []).map(Mapper.To.Mark));
			return Model.Block_Content_Text.create(obj);
		},

		BlockFile: (obj: Model.Block_Content_File) => {
			return Model.Block_Content_File.create(obj);
		},

		BlockBookmark: (obj: Model.Block_Content_Bookmark) => {
			return Model.Block_Content_Bookmark.create(obj);
		},

		BlockLink: (obj: Model.Block_Content_Link) => {
			return Model.Block_Content_Link.create(obj);
		},

		BlockDiv: (obj: Model.Block_Content_Div) => {
			return Model.Block_Content_Div.create(obj);
		},

		BlockRelation: (obj: Model.Block_Content_Relation) => {
			return Model.Block_Content_Relation.create(obj);
		},

		BlockLatex: (obj: Model.Block_Content_Latex) => {
			return Model.Block_Content_Latex.create(obj);
		},

		BlockDataview: (obj: any) => {
			return Model.Block_Content_Dataview.create({
				...obj,
				views: (obj.views || []).map(Mapper.To.View),
			});
		},

		BlockTable: (obj: Model.Block_Content_Table) => {
			return Model.Block_Content_Table.create(obj);
		},

		BlockTableRow: (obj: Model.Block_Content_TableRow) => {
			return Model.Block_Content_TableRow.create(obj);
		},

		BlockTableColumn: (obj: Model.Block_Content_TableColumn) => {
			return Model.Block_Content_TableColumn.create(obj);
		},

		BlockTableOfContents: (obj: Model.Block_Content_TableOfContents) => {
			return Model.Block_Content_TableOfContents.create(obj);
		},

		BlockWidget: (obj: Model.Block_Content_Widget) => {
			return Model.Block_Content_Widget.create(obj);
		},

		Block: (obj: any) => {
			obj = obj || {};
			obj.type = String(obj.type || I.BlockType.Empty);
			obj.content = U.Common.objectCopy(obj.content || {});

			const fm = U.Common.toUpperCamelCase(`block-${obj.type}`);	
			const block = Model.Block.create({
				...obj,
				verticalAlign: obj.vAlign,
				backgroundColor: obj.bgColor,
				content: Mapper.To[fm] ? Mapper.To[fm](obj.content) : obj.content,
			});
	
			if (obj.fields) {
				block.fields = Encode.struct(obj.fields);
			};

			return block;
		},

		ViewRelation: (obj: any) => {
			return Model.Block_Content_Dataview_Relation.create({
				...obj,
				dateIncludeTime: obj.includeTime,
			});
		},

		Filter: (obj: Model.Block_Content_Dataview_Filter) => {
			return Model.Block_Content_Dataview_Filter.create({
				...obj,
				value: Encode.value(obj.value),
			});
		},

		Sort: (obj: any) => {
			return Model.Block_Content_Dataview_Sort.create({
				...obj,
				customOrder: (obj.customOrder || []).map(Encode.value),
				emptyPlacement: obj.empty,
			});
		},

		View: (obj: I.View) => {
			obj = new M.View(U.Common.objectCopy(obj));
			
			const item = new Model.Block.Content.Dataview.View();

			item.setId(obj.id);
			item.setName(obj.name);
			item.setType(obj.type as any);
			item.setCoverrelationkey(obj.coverRelationKey);
			item.setGrouprelationkey(obj.groupRelationKey);
			item.setGroupbackgroundcolors(obj.groupBackgroundColors);
			item.setCoverfit(obj.coverFit);
			item.setCardsize(obj.cardSize as any);
			item.setHideicon(obj.hideIcon);
			item.setPagelimit(obj.pageLimit);
			item.setRelationsList(obj.relations.map(Mapper.To.ViewRelation));
			item.setFiltersList(obj.filters.map(Mapper.To.Filter));
			item.setSortsList(obj.sorts.map(Mapper.To.Sort));
			item.setDefaulttemplateid(obj.defaultTemplateId);
			item.setDefaultobjecttypeid(obj.defaultTypeId);

			return item;
		},

		PasteFile: (obj: any) => {
			const item = new Rpc.Block.Paste.Request.File();

			item.setName(obj.name);
			item.setLocalpath(obj.path);

			return item;
		},

		GroupOrder: (obj: any) => {
			const item = new Model.Block.Content.Dataview.GroupOrder();

			item.setViewid(obj.viewId);
			item.setViewgroupsList(obj.groups.map((it: any) => {
				const el = new Model.Block.Content.Dataview.ViewGroup();

				el.setGroupid(it.groupId);
				el.setIndex(it.index);
				el.setHidden(it.isHidden);
				el.setBackgroundcolor(it.bgColor);

				return el;
			}));

			return item;
		},

		ObjectOrder: (obj: any) => {
			const item = new Model.Block.Content.Dataview.ObjectOrder();

			item.setViewid(obj.viewId);
			item.setGroupid(obj.groupId);
			item.setObjectidsList(obj.objectIds);

			return item;
		},

		InternalFlag: (value: I.ObjectFlag) => {
			const item = new Model.InternalFlag();

			item.setValue(value as any);

			return item;
		},

		Snapshot: (obj: any) => {
			const item = new Rpc.Object.Import.Request.Snapshot();

			item.setId(obj.id);
			item.setSnapshot(obj.snapshot);

			return item;
		},

		ParticipantPermissionChange: (obj: any) => {
			const item = new Model.ParticipantPermissionChange();

			item.setIdentity(obj.identity);
			item.setPerms(obj.permissions);

			return item;
		},

	},

	Event: {

		Data (e: any) {
			return e.value[e.value.oneofKind];
		},

		AccountShow: (obj: Events.Event_Account_Show) => {
			return {
				account: Mapper.From.Account(obj.account),
			};
		},

		AccountUpdate: (obj: Events.Event_Account_Update) => {
			return {
				status: Mapper.From.AccountStatus(obj.getStatus()),
			};
		},

		AccountConfigUpdate: (obj: Events.Event_Account_Config_Update) => {
			return obj;
		},

		AccountLinkChallenge: (obj: Events.Event.Account.LinkChallenge) => {
			return {
				challenge: obj.getChallenge(),
			};
		},

		ObjectRelationsAmend: (obj: Events.Event.Object.Relations.Amend) => {
			return {
				id: obj.getId(),
				relations: (obj.getRelationlinksList() || []).map(Mapper.From.RelationLink),
			};
		},

		ObjectRelationsRemove: (obj: Events.Event.Object.Relations.Remove) => {
			return {
				id: obj.getId(),
				relationKeys: obj.getRelationkeysList() || [],
			};
		},

		ObjectRestrictionsSet: (obj: Events.Event.Object.Restrictions.Set) => {
			return {
				restrictions: Mapper.From.Restrictions(obj.getRestrictions()),
			};
		},

		FileSpaceUsage: (obj: Events.Event.File.SpaceUsage) => {
			return {
				spaceId: obj.getSpaceid(),
				bytesUsage: obj.getBytesusage(),
			};
		},

		FileLocalUsage: (obj: Events.Event.File.LocalUsage) => {
			return {
				localUsage: obj.getLocalbytesusage(),
			};
		},

		FileLimitUpdated: (obj: Events.Event.File.LimitUpdated) => {
			return {
				bytesLimit: obj.getByteslimit(),
			};
		},

		BlockAdd: (obj: Events.Event.Block.Add) => {
			return {
				blocks: (obj.getBlocksList() || []).map(Mapper.From.Block),
			};
		},

		BlockDelete: (obj: Events.Event.Block.Delete) => {
			return {
				blockIds: obj.getBlockidsList() || [],
			};
		},

		BlockSetChildrenIds: (obj: Events.Event.Block.Set.ChildrenIds) => {
			return {
				id: obj.getId(),
				childrenIds: obj.getChildrenidsList() || [],
			};
		},

		BlockSetFields: (obj: Events.Event.Block.Set.Fields) => {
			return {
				id: obj.getId(),
				fields: obj.hasFields() ? Decode.struct(obj.getFields()) : {},
			};
		},

		BlockSetLink: (obj: Events.Event.Block.Set.Link) => {
			return {
				id: obj.getId(),
				targetBlockId: obj.hasTargetblockid() ? obj.getTargetblockid().getValue() : null,
				cardStyle: obj.hasCardstyle() ? obj.getCardstyle().getValue() : null,
				iconSize: obj.hasIconsize() ? obj.getIconsize().getValue() : null,
				description: obj.hasDescription() ? obj.getDescription().getValue() : null,
				relations: obj.hasRelations() ? obj.getRelations().getValueList() || [] : null,
				fields: obj.hasFields() ? Decode.struct(obj.getFields()) : null,
			};
		},

		BlockSetText: (obj: Events.Event.Block.Set.Text) => {
			return {
				id: obj.getId(),
				text: obj.hasText() ? obj.getText().getValue() : null,
				style: obj.hasStyle() ? obj.getStyle().getValue() : null,
				checked: obj.hasChecked() ? obj.getChecked().getValue() : null,
				color: obj.hasColor() ? obj.getColor().getValue() : null,
				iconEmoji: obj.hasIconemoji() ? obj.getIconemoji().getValue() : null,
				iconImage: obj.hasIconimage() ? obj.getIconimage().getValue() : null,
				marks: obj.hasMarks() ? (obj.getMarks().getValue().getMarksList() || []).map(Mapper.From.Mark) : null,
			};
		},

		BlockSetDiv: (obj: Events.Event.Block.Set.Div) => {
			return {
				id: obj.getId(),
				style: obj.hasStyle() ? obj.getStyle().getValue() : null,
			};
		},

		BlockDataviewTargetObjectIdSet: (obj: Events.Event.Block.Dataview.TargetObjectIdSet) => {
			return {
				id: obj.getId(),
				targetObjectId: obj.getTargetobjectid(),
			};
		},

		BlockDataviewIsCollectionSet: (obj: Events.Event.Block.Dataview.IsCollectionSet) => {
			return {
				id: obj.getId(),
				isCollection: obj.getValue(),
			};
		},

		BlockSetWidget: (obj: Events.Event.Block.Set.Widget) => {
			return {
				id: obj.getId(),
				layout: obj.hasLayout() ? obj.getLayout().getValue() : null,
				limit: obj.hasLimit() ? obj.getLimit().getValue() : null,
				viewId: obj.hasViewid() ? obj.getViewid().getValue() : null,
			};
		},

		BlockSetFile: (obj: Events.Event.Block.Set.File) => {
			return {
				id: obj.getId(),
				targetObjectId: obj.hasTargetobjectid() ? obj.getTargetobjectid().getValue() : null,
				type: obj.hasType() ? obj.getType().getValue() : null,
				style: obj.hasStyle() ? obj.getStyle().getValue() : null,
				state: obj.hasState() ? obj.getState().getValue() : null,
			};
		},

		BlockSetBookmark: (obj: Events.Event.Block.Set.Bookmark) => {
			return {
				id: obj.getId(),
				targetObjectId: obj.hasTargetobjectid() ? obj.getTargetobjectid().getValue() : null,
				state: obj.hasState() ? obj.getState().getValue() : null,
			};
		},

		BlockSetBackgroundColor: (obj: Events.Event.Block.Set.BackgroundColor) => {
			return {
				id: obj.getId(),
				bgColor: obj.getBackgroundcolor(),
			};
		},

		BlockSetAlign: (obj: Events.Event.Block.Set.Align) => {
			return {
				id: obj.getId(),
				align: obj.getAlign(),
			};
		},

		BlockSetVerticalAlign: (obj: Events.Event.Block.Set.VerticalAlign) => {
			return {
				id: obj.getId(),
				align: obj.getVerticalalign(),
			};
		},

		BlockSetRelation: (obj: Events.Event.Block.Set.Relation) => {
			return {
				id: obj.getId(),
				key: obj.hasKey() ? obj.getKey().getValue() : null,
			};
		},

		BlockSetLatex: (obj: Events.Event.Block.Set.Latex) => {
			return {
				id: obj.getId(),
				text: obj.hasText() ? obj.getText().getValue() : null,
			};
		},

		BlockSetTableRow: (obj: Events.Event.Block.Set.TableRow) => {
			return {
				id: obj.getId(),
				isHeader: obj.hasIsheader() ? obj.getIsheader().getValue() : null,
			};
		},

		BlockDataviewViewSet: (obj: Events.Event.Block.Dataview.ViewSet) => {
			return {
				id: obj.getId(),
				view: Mapper.From.View(obj.getView()),
			};
		},

		BlockDataviewViewUpdate: (obj: Events.Event.Block.Dataview.ViewUpdate) => {
			const ret = {
				id: obj.getId(),
				viewId: obj.getViewid(),
				fields: obj.hasFields() ? Mapper.From.ViewFields(obj.getFields()) : null,
			};

			const keys = [ 
				{ id: 'filter', field: 'filters', mapper: 'Filter' },
				{ id: 'sort', field: 'sorts', mapper: 'Sort' },
				{ id: 'relation', field: 'relations', mapper: 'ViewRelation' },
			];

			keys.forEach(key => {
				const items = obj[U.Common.toCamelCase(`get-${key.id}-list`)]() || [];

				ret[key.field] = [];

				items.forEach(item => {
					if (item.hasAdd()) {
						const op = item.getAdd();
						const afterId = op.getAfterid();
						const items = (op.getItemsList() || []).map(Mapper.From[key.mapper]);

						ret[key.field].push({ add: { afterId, items } });
					};

					if (item.hasMove()) {
						const op = item.getMove();
						const afterId = op.getAfterid();
						const ids = op.getIdsList() || [];

						ret[key.field].push({ move: { afterId, ids } });
					};

					if (item.hasUpdate()) {
						const op = item.getUpdate();

						if (op.hasItem()) {
							const item = Mapper.From[key.mapper](op.getItem());

							ret[key.field].push({ update: { id: op.getId(), item } });
						};
					};

					if (item.hasRemove()) {
						const op = item.getRemove();
						const ids = op.getIdsList() || [];

						ret[key.field].push({ remove: { ids } });
					};
				});
			});

			return ret;
		},

		BlockDataviewViewDelete: (obj: Events.Event_Block_Dataview_ViewDelete) => {
			return obj;
		},

		BlockDataviewViewOrder: (obj: Events.Event_Block_Dataview_ViewOrder) => {
			return obj;
		},

		BlockDataviewRelationDelete: (obj: Events.Event_Block_Dataview_RelationDelete) => {
			return obj;
		},

		BlockDataviewRelationSet: (obj: Events.Event_Block_Dataview_RelationSet) => {
			return {
				...obj,
				relations: (obj.relationLinks || []).map(Mapper.From.RelationLink),
			};
		},

		BlockDataviewGroupOrderUpdate: (obj: Events.Event_Block_Dataview_GroupOrderUpdate) => {
			return {
				...obj,
				groupOrder: Mapper.From.GroupOrder(obj.groupOrder),
			};
		},

		BlockDataviewObjectOrderUpdate: (obj: Events.Event_Block_Dataview_ObjectOrderUpdate) => {
			return {
				id: obj.id,
				groupId: obj.groupId,
				viewId: obj.viewId,
				changes: (obj.sliceChanges || []).map(it => {
					return {
						...it,
						operation: it.op,
					};
				})
			};
		},

		ObjectDetailsSet: (obj: Events.Event_Object_Details_Set) => {
			return {
				...obj,
				details: Decode.struct(obj.details),
			};
		},

		ObjectDetailsAmend: (obj: Events.Event_Object_Details_Amend) => {
			const details = {};
			(obj.details || []).forEach(it => details[it.key] = Decode.value(it.value));

			return {
				id: obj.id,
				subIds: obj.subIds || [],
				details,
			};
		},

		ObjectDetailsUnset: (obj: Events.Event_Object_Details_Unset) => {
			return {
				id: obj.id,
				subIds: obj.subIds,
				keys: obj.keys,
			};
		},

		SubscriptionAdd: (obj: Events.Event_Object_Subscription_Add) => {
			return {
				id: obj.id,
				afterId: obj.afterId,
				subId: obj.subId,
			};
		},

		SubscriptionRemove: (obj: Events.Event_Object_Subscription_Remove) => {
			return {
				id: obj.id,
				subId: obj.subId,
			};
		},

		SubscriptionPosition: (obj: Events.Event_Object_Subscription_Position) => {
			return {
				id: obj.id,
				afterId: obj.afterId,
				subId: obj.subId,
			};
		},

		SubscriptionCounters: (obj: Events.Event_Object_Subscription_Counters) => {
			return {
				total: obj.total,
				subId: obj.subId,
			};
		},

		SubscriptionGroups: (obj: Events.Event_Object_Subscription_Groups) => {
			return {
				subId: obj.subId,
				group: Mapper.From.BoardGroup(obj.group),
				remove: obj.remove,
			};
		},

		NotificationSend: (obj: Events.Event_Notification_Send) => {
			return {
				notification: Mapper.From.Notification(obj.notification),
			};
		},

		NotificationUpdate: (obj: Events.Event_Notification_Update) => {
			return {
				notification: Mapper.From.Notification(obj.notification),
			};
		},

		PayloadBroadcast: (obj: Events.Event_Payload_Broadcast) => {
			return {
				payload: obj.payload,
			};
		},

		MembershipUpdate: (obj: Events.Event_Membership_Update) => {
			return {
				membership: Mapper.From.Membership(obj.data),
			};
		},

		ProcessNew: (obj: Events.Event_Process_New) => {
			return {
				process: Mapper.From.Process(obj.process),
			};
		},

		ProcessUpdate: (obj: Events.Event_Process_Update) => {
			return {
				process: Mapper.From.Process(obj.process),
			};
		},

		ProcessDone: (obj: Events.Event_Process_Done) => {
			return {
				process: Mapper.From.Process(obj.process),
			};
		},

		SpaceSyncStatusUpdate: (obj: Events.Event_Space_SyncStatus_Update) => {
			return {
				error: obj.error,
				network: obj.network,
				status: obj.status,
				syncingCounter: obj.syncingObjectsCounter,
			};
		},
	},

};