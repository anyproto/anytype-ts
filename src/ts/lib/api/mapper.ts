import { I, M, U, Encode, Decode } from 'Lib';
import { Rpc } from 'dist/lib/pb/protos/commands_pb';
import Model from 'dist/lib/pkg/lib/pb/model/protos/models_pb';
import Events from 'dist/lib/pb/protos/events_pb';

export const Mapper = {

	BlockType: (v: Model.Block.ContentCase): I.BlockType => {
		const V = Model.Block.ContentCase;

		let t = I.BlockType.Empty;
		if (v == V.SMARTBLOCK)			 t = I.BlockType.Page;
		if (v == V.TEXT)				 t = I.BlockType.Text;
		if (v == V.FILE)				 t = I.BlockType.File;
		if (v == V.LAYOUT)				 t = I.BlockType.Layout;
		if (v == V.DIV)					 t = I.BlockType.Div;
		if (v == V.BOOKMARK)			 t = I.BlockType.Bookmark;
		if (v == V.LINK)				 t = I.BlockType.Link;
		if (v == V.DATAVIEW)			 t = I.BlockType.Dataview;
		if (v == V.RELATION)			 t = I.BlockType.Relation;
		if (v == V.FEATUREDRELATIONS)	 t = I.BlockType.Featured;
		if (v == V.LATEX)				 t = I.BlockType.Embed;
		if (v == V.TABLE)				 t = I.BlockType.Table;
		if (v == V.TABLECOLUMN)			 t = I.BlockType.TableColumn;
		if (v == V.TABLEROW)			 t = I.BlockType.TableRow;
		if (v == V.TABLEOFCONTENTS)		 t = I.BlockType.TableOfContents;
		if (v == V.WIDGET)		 		 t = I.BlockType.Widget;
		if (v == V.CHAT)				 t = I.BlockType.Chat;
		return t;
	},

	BoardGroupType (v: Model.Block.Content.Dataview.Group.ValueCase) {
		const V = Model.Block.Content.Dataview.Group.ValueCase;

		let t = '';
		if (v == V.STATUS)	 t = 'status';
		if (v == V.TAG)		 t = 'tag';
		if (v == V.CHECKBOX) t = 'checkbox';
		if (v == V.DATE)	 t = 'date';
		return t;
	},

	NotificationPayload (v: Model.Notification.PayloadCase) {
		const V = Model.Notification.PayloadCase;

		let t = '';
		if (v == V.IMPORT)			 t = 'import';
		if (v == V.EXPORT)			 t = 'export';
		if (v == V.GALLERYIMPORT)	 t = 'galleryImport';
		if (v == V.REQUESTTOJOIN)	 t = 'requestToJoin';
		if (v == V.REQUESTTOLEAVE)	 t = 'requestToLeave';
		if (v == V.PARTICIPANTREQUESTAPPROVED)	 t = 'participantRequestApproved';
		if (v == V.PARTICIPANTREMOVE) t = 'participantRemove';
		if (v == V.PARTICIPANTREQUESTDECLINE) t = 'participantRequestDecline';
		if (v == V.PARTICIPANTPERMISSIONSCHANGE) t = 'participantPermissionsChange';

		return t;
	},

	ProcessType (v: Events.Model.Process.MessageCase) {
		const V = Events.Model.Process.MessageCase;

		let t = '';
		if (v == V.DROPFILES)		 t = 'dropFiles';
		if (v == V.IMPORT)			 t = 'import';
		if (v == V.EXPORT)			 t = 'export';
		if (v == V.SAVEFILE)		 t = 'saveFile';
		if (v == V.MIGRATION)		 t = 'migration';

		return t;
	},

	From: {

		Account: (obj: Model.Account): I.Account => {
			return {
				id: obj.getId(),
				info: obj.hasInfo() ? Mapper.From.AccountInfo(obj.getInfo()) : null,
				config: obj.hasConfig() ? Mapper.From.AccountConfig(obj.getConfig()) : null,
				status: obj.hasStatus() ? Mapper.From.AccountStatus(obj.getStatus()) : null,
			};
		},

		AccountInfo: (obj: Model.Account.Info): I.AccountInfo => {
			return {
				homeObjectId: obj.getHomeobjectid(),
				profileObjectId: obj.getProfileobjectid(),
				gatewayUrl: obj.getGatewayurl(),
				deviceId: obj.getDeviceid(),
				localStoragePath: obj.getLocalstoragepath(),
				accountSpaceId: obj.getAccountspaceid(),
				techSpaceId: obj.getTechspaceid(),
				spaceViewId: obj.getSpaceviewid(),
				widgetsId: obj.getWidgetsid(),
				analyticsId: obj.getAnalyticsid(),
				networkId: obj.getNetworkid(),
				workspaceObjectId: obj.getWorkspaceobjectid(),
				ethereumAddress: obj.getEthereumaddress(),
			};
		},

		AccountConfig: (obj: Model.Account.Config): I.AccountConfig => {
			return {};
		},

		AccountStatus: (obj: Model.Account.Status): I.AccountStatus => {
			return {
				type: obj.getStatustype() as number,
				date: obj.getDeletiondate(),
			};
		},
		
		ObjectInfo: (obj: any): I.PageInfo => {
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

		Range: (obj: Model.Range): I.TextRange => {
			return {
				from: obj.getFrom(),
				to: obj.getTo(),
			};
		},

		Mark: (obj: Model.Block.Content.Text.Mark): I.Mark => {
			return {
				type: obj.getType() as number,
				param: obj.getParam(),
				range: Mapper.From.Range(obj.getRange()),
			};
		},

		PreviewLink: (obj: Model.LinkPreview) => {
			return {
				type: obj.getType(),
				title: obj.getTitle(),
				description: obj.getDescription(),
				faviconUrl: obj.getFaviconurl(),
				imageUrl: obj.getImageurl(),
				url: obj.getUrl(),
			};
		},

		Details: (obj: any): any => {
			return {
				id: obj.getId(),
				details: Decode.struct(obj.getDetails()),
			};
		},

		BlockPage: () => {
			return {};
		},

		BlockFeatured: () => {
			return {};
		},

		BlockLayout: (obj: Model.Block.Content.Layout) => {
			return {
				style: obj.getStyle(),
			};
		},

		BlockDiv: (obj: Model.Block.Content.Div) => {
			return {
				style: obj.getStyle(),
			};
		},

		BlockLink: (obj: Model.Block.Content.Link) => {
			return {
				targetBlockId: obj.getTargetblockid(),
				iconSize: obj.getIconsize(),
				cardStyle: obj.getCardstyle(),
				description: obj.getDescription(),
				relations: obj.getRelationsList() || [],
			};
		},

		BlockBookmark: (obj: Model.Block.Content.Bookmark) => {
			return {
				targetObjectId: obj.getTargetobjectid(),
				state: obj.getState(),
				url: obj.getUrl(),
			};
		},

		BlockText: (obj: Model.Block.Content.Text) => {
			let marks = [];
			if (obj.hasMarks()) {
				marks = (obj.getMarks().getMarksList() || []).map(Mapper.From.Mark);
			};

			return {
				text: obj.getText(),
				style: obj.getStyle(),
				checked: obj.getChecked(),
				color: obj.getColor(),
				marks,
				iconEmoji: obj.getIconemoji(),
				iconImage: obj.getIconimage(),
			};
		},

		BlockFile: (obj: Model.Block.Content.File) => {
			return {
				targetObjectId: obj.getTargetobjectid(),
				type: obj.getType(),
				style: obj.getStyle(),
				addedAt: obj.getAddedat(),
				state: obj.getState(),
			};
		},

		BlockDataview: (obj: Model.Block.Content.Dataview) => {
			return {
				sources: obj.getSourceList(),
				viewId: obj.getActiveview(),
				views: (obj.getViewsList() || []).map(Mapper.From.View),
				relationLinks: (obj.getRelationlinksList() || []).map(Mapper.From.RelationLink),
				groupOrder: (obj.getGroupordersList() || []).map(Mapper.From.GroupOrder),
				objectOrder: (obj.getObjectordersList() || []).map(Mapper.From.ObjectOrder),
				targetObjectId: obj.getTargetobjectid(),
				isCollection: obj.getIscollection(),
			};
		},

		BlockRelation: (obj: Model.Block.Content.Relation) => {
			return {
				key: obj.getKey(),
			};
		},

		BlockLatex: (obj: Model.Block.Content.Latex) => {
			return {
				text: obj.getText(),
				processor: obj.getProcessor(),
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

		BlockTableRow: (obj: Model.Block.Content.TableRow) => {
			return {
				isHeader: obj.getIsheader(),
			};
		},

		BlockWidget: (obj: Model.Block.Content.Widget) => {
			return {
				layout: obj.getLayout(),
				limit: obj.getLimit(),
				viewId: obj.getViewid(),
				autoAdded: obj.getAutoadded(),
			};
		},

		BlockChat: () => {
			return {};
		},

		Block: (obj: Model.Block): I.Block => {
			const cc = obj.getContentCase();
			const type = Mapper.BlockType(obj.getContentCase());
			const fn = `get${U.Common.ucFirst(type)}`;
			const fm = U.Common.toUpperCamelCase(`block-${type}`);
			const content = obj[fn] ? obj[fn]() : {};
			const item: I.Block = {
				id: obj.getId(),
				type: type,
				childrenIds: obj.getChildrenidsList() || [],
				fields: Decode.struct(obj.getFields()) || {},
				hAlign: obj.getAlign() as number,
				vAlign: obj.getVerticalalign() as number,
				bgColor: obj.getBackgroundcolor(),
				content: {} as any,
			};

			if (Mapper.From[fm]) {
				item.content = Mapper.From[fm](content);
			} else {
				console.log('[Mapper] From does not exist: ', fm, cc);
			};
			return item;
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
				relationKey: obj.getKey(),
				format: obj.getFormat(),
			};
		},

		View: (obj: Model.Block.Content.Dataview.View): I.View => {
			return Object.assign({
				id: obj.getId(),
				sorts: obj.getSortsList().map(Mapper.From.Sort),
				filters: obj.getFiltersList().map(Mapper.From.Filter),
				relations: obj.getRelationsList().map(Mapper.From.ViewRelation),
			}, Mapper.From.ViewFields(obj));
		},

		ViewFields: (obj: any): any => {
			return {
				type: obj.getType(),
				name: obj.getName(),
				coverRelationKey: obj.getCoverrelationkey(),
				coverFit: obj.getCoverfit(),
				cardSize: obj.getCardsize(),
				hideIcon: obj.getHideicon(),
				groupRelationKey: obj.getGrouprelationkey(),
				groupBackgroundColors: obj.getGroupbackgroundcolors(),
				pageLimit: obj.getPagelimit(),
				defaultTemplateId: obj.getDefaulttemplateid(),
				defaultTypeId: obj.getDefaultobjecttypeid(),
			};
		},

		ViewRelation: (obj: Model.Block.Content.Dataview.Relation) => {
			return {
				relationKey: obj.getKey(),
				isVisible: obj.getIsvisible(),
				width: obj.getWidth(),
				includeTime: obj.getDateincludetime(),
				formulaType: obj.getFormula(),
				align: obj.getAlign(),
			};
		},

		Filter: (obj: Model.Block.Content.Dataview.Filter): I.Filter => {
			return {
				id: obj.getId(),
				relationKey: obj.getRelationkey(),
				operator: obj.getOperator() as number,
				condition: obj.getCondition() as number,
				quickOption: obj.getQuickoption() as number,
				value: obj.hasValue() ? Decode.value(obj.getValue()) : null,
			};
		},

		Sort: (obj: Model.Block.Content.Dataview.Sort): I.Sort => {
			return {
				id: obj.getId(),
				relationKey: obj.getRelationkey(),
				type: obj.getType() as number,
				customOrder: (obj.getCustomorderList() || []).map(Decode.value),
				empty: obj.getEmptyplacement() as number,
			};
		},

		HistoryVersion: (obj: Rpc.History.Version): I.HistoryVersion => {
			return {
				id: obj.getId(),
				previousIds: obj.getPreviousidsList() || [],
				authorId: obj.getAuthorid(),
				groupId: obj.getGroupid(),
				time: obj.getTime(),
			};
		},

		GraphEdge: (obj: Rpc.Object.Graph.Edge) => {
			return {
				type: obj.getType(),
				source: obj.getSource(),
				target: obj.getTarget(),
				name: obj.getName(),
				description: obj.getDescription(),
				iconImage: obj.getIconimage(),
				iconEmoji: obj.getIconemoji(),
				isHidden: obj.getHidden(),
			};
		},

		UnsplashPicture: (obj: Rpc.Unsplash.Search.Response.Picture) => {
			return {
				id: obj.getId(),
				url: obj.getUrl(),
				artist: obj.getArtist(),
				artistUrl: obj.getArtisturl(),
			};
		},

		ObjectView: (obj: Model.ObjectView) => {
			return {
				rootId: obj.getRootid(),
				blocks: (obj.getBlocksList() || []).map(Mapper.From.Block),
				details: (obj.getDetailsList() || []).map(Mapper.From.Details),
				restrictions: Mapper.From.Restrictions(obj.getRestrictions()),
				participants: (obj.getBlockparticipantsList() || []).map(it => ({
					blockId: it.getBlockid(),
					participantId: it.getParticipantid(),
				})),
			};
		},

		BoardGroup: (obj: any): I.BoardGroup => {
			const type = Mapper.BoardGroupType(obj.getValueCase());
			const fn = `get${U.Common.ucFirst(type)}`;
			const field = obj[fn] ? obj[fn]() : null;

			let value: any = null;

			if (field) {
				switch (type) {
					case 'status':	 value = field.getId(); break;
					case 'tag':		 value = field.getIdsList(); break;
					case 'checkbox': value = field.getChecked(); break;
				};
			};

			return { 
				id: obj.getId(),
				value,
			};
		},

		GroupOrder: (obj: Model.Block.Content.Dataview.GroupOrder) => {
			return {
				viewId: obj.getViewid(),
				groups: (obj.getViewgroupsList() || []).map((it: any) => {
					return {
						groupId: it.getGroupid(),
						index: it.getIndex(),
						isHidden: it.getHidden(),
						bgColor: it.getBackgroundcolor(),
					};
				}),
			};
		},

		ObjectOrder: (obj: Model.Block.Content.Dataview.ObjectOrder) => {
			return {
				viewId: obj.getViewid(),
				groupId: obj.getGroupid(),
				objectIds: obj.getObjectidsList() || [],
			};
		},

		ObjectSearchWithMeta: (obj: any) => {
			return {
				...Decode.struct(obj.getDetails()),
				metaList: (obj.getMetaList() || []).map(Mapper.From.MetaList),
			};
		},

		Notification: (obj: Model.Notification): I.Notification => {
			const type = Mapper.NotificationPayload(obj.getPayloadCase());
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
				id: obj.getId(),
				createTime: obj.getCreatetime(),
				status: obj.getStatus() as number,
				isLocal: obj.getIslocal(),
				type: type as I.NotificationType,
				payload,
			};
		},

		Manifest: (obj: Model.ManifestInfo) => {
			return {
				id: obj.getId(),
				schema: obj.getSchema(),
				name: obj.getName(),
				author: obj.getAuthor(),
				license: obj.getLicense(),
				title: obj.getTitle(),
				description: obj.getDescription(),
				downloadLink: obj.getDownloadlink(),
				size: obj.getFilesize(),
				screenshots: obj.getScreenshotsList() || [],
				categories: obj.getCategoriesList() || [],
			};
		},

		Membership: (obj: Model.Membership): I.Membership => {
			return {
				tier: obj.getTier(),
				status: obj.getStatus() as number,
				dateStarted: obj.getDatestarted(),
				dateEnds: obj.getDateends(),
				isAutoRenew: obj.getIsautorenew(),
				paymentMethod: obj.getPaymentmethod() as number,
				name: obj.getNsname(),
				nameType: obj.getNsnametype() as number,
				userEmail: obj.getUseremail(),
				subscribeToNewsletter: obj.getSubscribetonewsletter(),	
			};
		},

		MembershipTierData: (obj: Model.MembershipTierData): I.MembershipTier => {
			return {
				id: obj.getId(),
				name: obj.getName(),
				description: obj.getDescription(),
				nameMinLength: obj.getAnynameminlength(),
				isTest: obj.getIstest(),
				periodType: obj.getPeriodtype() as number,
				period: obj.getPeriodvalue(),
				priceCents: obj.getPricestripeusdcents(),
				colorStr: obj.getColorstr(),
				features: obj.getFeaturesList(),
				namesCount: obj.getAnynamescountincluded()
			};
		},

		Process: (obj: Events.Model.Process) => {
			const type = Mapper.ProcessType(obj.getMessageCase());

			return {
				id: obj.getId(),
				state: obj.getState() as number,
				type,
				spaceId: obj.getSpaceid(),
				progress: Mapper.From.Progress(obj.getProgress()),
				error: obj.getError(),
			};
		},

		Progress: (obj: Events.Model.Process.Progress) => {
			return {
				done: obj.getDone(),
				total: obj.getTotal(),
				message: obj.getMessage(),
			};
		},

		MetaList: (obj: Model.Search.Meta): any => {
			return {
				highlight: obj.getHighlight(),
				blockId: obj.getBlockid(),
				relationKey: obj.getRelationkey(),
				relationDetails: Decode.struct(obj.getRelationdetails()),
				ranges: (obj.getHighlightrangesList() || []).map(Mapper.From.Range),
			};
		},

		DeviceInfo: (obj: Model.DeviceInfo): any => {
			return {
				id: obj.getId(),
				name: obj.getName(),
				addDate: obj.getAdddate(),
				isConnected: obj.getIsconnected(),
				archived: obj.getArchived()
			};
		},

		ChatMessage: (obj: Model.ChatMessage): Partial<I.ChatMessage> => {
			return {
				id: obj.getId(),
				orderId: obj.getOrderid(),
				creator: obj.getCreator(),
				createdAt: obj.getCreatedat(),
				modifiedAt: obj.getModifiedat(),
				replyToMessageId: obj.getReplytomessageid(),
				content: Mapper.From.ChatMessageContent(obj.getMessage()),
				attachments: (obj.getAttachmentsList() || []).map(Mapper.From.ChatMessageAttachment),
				reactions: Mapper.From.ChatMessageReaction(obj.getReactions()),
				isReadMessage: obj.getRead(),
				isReadMention: obj.getMentionread(),
			};
		},

		ChatState: (obj: Model.ChatState): I.ChatState => {
			return {
				messages: Mapper.From.ChatStateUnreadMessages(obj.getMessages()),
				mentions: Mapper.From.ChatStateUnreadMessages(obj.getMentions()),
				lastStateId: obj.getLaststateid(),
			};
		},

		ChatStateUnreadMessages (obj: any): I.ChatStateCounter {
			return {
				orderId: obj.getOldestorderid(),
				counter: obj.getCounter(),
			};
		},

		ChatMessageContent (obj: Model.ChatMessage.MessageContent): I.ChatMessageContent {
			return {
				text: obj.getText(),
				style: obj.getStyle() as number,
				marks: (obj.getMarksList() || []).map(Mapper.From.Mark),
			};
		},

		ChatMessageAttachment (obj: Model.ChatMessage.Attachment): I.ChatMessageAttachment {
			return {
				target: obj.getTarget(),
				type: obj.getType() as number,
			};
		},

		ChatMessageReaction (obj: Model.ChatMessage.Reactions) {
			const reactions = [];

			obj.getReactionsMap().forEach((identityList, emoji) => {
				reactions.push({ icon: emoji, authors: identityList.getIdsList() });
			});

			return reactions;
		},

		PublishState: (obj: Rpc.Publishing.PublishState): any => {
			return {
				spaceId: obj.getSpaceid(),
				objectId: obj.getObjectid(),
				uri: obj.getUri(),
				status: obj.getStatus() as number,
				version: obj.getVersion(),
				timestamp: obj.getTimestamp(),
				size: obj.getSize(),
				details: Decode.struct(obj.getDetails()),
				joinSpace: obj.getJoinspace(),
			};
		},

	},

	//------------------------------------------------------------

	To: {

		Range: (obj: any) => {
			const item = new Model.Range();

			item.setFrom(obj.from);
			item.setTo(obj.to);

			return item;
		},

		Mark: (obj: any) => {
			const item = new Model.Block.Content.Text.Mark();

			item.setType(obj.type);
			item.setParam(obj.param);
			item.setRange(Mapper.To.Range(obj.range));

			return item;
		},

		Details: (obj: any) => {
			const item = new Model.Detail();

			item.setKey(obj.key);
			item.setValue(Encode.value(obj.value));

			return item;
		},

		Fields: (obj: any) => {
			const item = new Rpc.Block.ListSetFields.Request.BlockField();

			item.setBlockid(obj.blockId);
			item.setFields(Encode.struct(obj.fields || {}));

			return item;
		},

		BlockFeatured: () => {
			return new Model.Block.Content.FeaturedRelations();
		},

		BlockLayout: (obj: any) => {
			const content = new Model.Block.Content.Layout();
			
			content.setStyle(obj.style);

			return content;
		},

		BlockText: (obj: any) => {
			const marks = (obj.marks || []).map(Mapper.To.Mark);
			const content = new Model.Block.Content.Text();

			content.setText(obj.text);
			content.setStyle(obj.style);
			content.setChecked(obj.checked);
			content.setColor(obj.color);
			content.setMarks(new Model.Block.Content.Text.Marks().setMarksList(marks));
			content.setIconemoji(obj.iconEmoji);
			content.setIconimage(obj.iconImage);

			return content;
		},

		BlockFile: (obj: any) => {
			const content = new Model.Block.Content.File();
	
			content.setTargetobjectid(obj.targetObjectId);
			content.setType(obj.type);
			content.setAddedat(obj.addedAt);
			content.setState(obj.state);
			content.setStyle(obj.style);
			content.setTargetobjectid(obj.targetObjectId);

			return content;
		},

		BlockBookmark: (obj: any) => {
			const content = new Model.Block.Content.Bookmark();
	
			content.setTargetobjectid(obj.targetObjectId);
			content.setState(obj.state);
			content.setUrl(obj.url);

			return content;
		},

		BlockLink: (obj: any) => {
			const content = new Model.Block.Content.Link();
	
			content.setTargetblockid(obj.targetBlockId);
			content.setIconsize(obj.iconSize);
			content.setCardstyle(obj.cardStyle);
			content.setDescription(obj.description);
			content.setRelationsList(obj.relations);

			return content;
		},

		BlockDiv: (obj: any) => {
			const content = new Model.Block.Content.Div();

			content.setStyle(obj.style);

			return content;
		},

		BlockRelation: (obj: any) => {
			const content = new Model.Block.Content.Relation();

			content.setKey(obj.key);

			return content;
		},

		BlockLatex: (obj: any) => {
			const content = new Model.Block.Content.Latex();
	
			content.setText(obj.text);
			content.setProcessor(obj.processor);

			return content;
		},

		BlockDataview: (obj: any) => {
			const content = new Model.Block.Content.Dataview();

			content.setTargetobjectid(obj.targetObjectId);
			content.setIscollection(obj.isCollection);
			content.setViewsList((obj.views || []).map(Mapper.To.View));
	
			return content;
		},

		BlockTable: () => {
			const content = new Model.Block.Content.Table();

			return content;
		},

		BlockTableRow: (obj: any) => {
			const content = new Model.Block.Content.TableRow();

			content.setIsheader(obj.isHeader);

			return content;
		},

		BlockTableColumn: () => {
			const content = new Model.Block.Content.TableColumn();

			return content;
		},

		BlockTableOfContents: () => {
			const content = new Model.Block.Content.TableOfContents();
	
			return content;
		},

		BlockWidget: (obj: any) => {
			const content = new Model.Block.Content.Widget();
			
			content.setLayout(obj.layout);
			content.setLimit(obj.limit);
			content.setViewid(obj.viewId);

			return content;
		},

		BlockChat: (obj: any) => {
			const content = new Model.Block.Content.Chat();
			
			return content;
		},

		Block: (obj: any) => {
			obj = obj || {};
			obj.type = String(obj.type || I.BlockType.Empty);
			obj.content = U.Common.objectCopy(obj.content || {});
	
			const block = new Model.Block();
	
			block.setId(obj.id);
			block.setAlign(obj.hAlign);
			block.setVerticalalign(obj.vAlign);
			block.setBackgroundcolor(obj.bgColor);
	
			if (obj.childrenIds) {
				block.setChildrenidsList(obj.childrenIds);
			};
	
			if (obj.fields) {
				block.setFields(Encode.struct(obj.fields || {}));
			};

			const fb = U.Common.toCamelCase(`set-${obj.type.toLowerCase()}`);
			const fm = U.Common.toUpperCamelCase(`block-${obj.type}`);

			if (block[fb] && Mapper.To[fm]) {
				block[fb](Mapper.To[fm](obj.content));
			} else {
				console.log('[Mapper] Block method or To method do not exist: ', fb, fm);
			};

			return block;
		},

		ViewRelation: (obj: any) => {
			const item = new Model.Block.Content.Dataview.Relation();

			item.setKey(obj.relationKey);
			item.setIsvisible(obj.isVisible);
			item.setWidth(obj.width);
			item.setDateincludetime(obj.includeTime);
			item.setFormula(obj.formulaType);
			item.setAlign(obj.align as number);

			return item;
		},

		Filter: (obj: any) => {
			const item = new Model.Block.Content.Dataview.Filter();
			
			item.setId(obj.id);
			item.setRelationkey(obj.relationKey);
			item.setFormat(obj.format);
			item.setOperator(obj.operator);
			item.setCondition(obj.condition);
			item.setQuickoption(obj.quickOption);
			item.setValue(Encode.value(obj.value));
			item.setIncludetime(obj.includeTime);
			item.setNestedfiltersList((obj.nestedFilters || []).map(Mapper.To.Filter));

			return item;
		},

		Sort: (obj: any) => {
			const item = new Model.Block.Content.Dataview.Sort();

			item.setId(obj.id);
			item.setRelationkey(obj.relationKey);
			item.setType(obj.type);
			item.setCustomorderList((obj.customOrder || []).map(Encode.value));
			item.setFormat(obj.format);
			item.setIncludetime(obj.includeTime);
			item.setEmptyplacement(obj.empty);

			return item;
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

		ChatMessage: (obj: I.ChatMessage) => {
			const item = new Model.ChatMessage();

			item.setId(obj.id);
			item.setOrderid(obj.orderId);
			item.setCreator(obj.creator);
			item.setReplytomessageid(obj.replyToMessageId);
			item.setMessage(Mapper.To.ChatMessageContent(obj.content));
			item.setAttachmentsList(obj.attachments.map(Mapper.To.ChatMessageAttachment));
			item.setReactions(Mapper.To.ChatMessageReaction(obj.reactions));

			return item;
		},

		ChatMessageContent: (obj: I.ChatMessageContent) => {
			const item = new Model.ChatMessage.MessageContent();

			item.setText(obj.text);
			item.setStyle(obj.style as number);
			item.setMarksList(obj.marks.map(Mapper.To.Mark));

			return item;
		},

		ChatMessageAttachment: (obj: I.ChatMessageAttachment) => {
			const item = new Model.ChatMessage.Attachment();

			item.setTarget(obj.target);
			item.setType(obj.type as number);

			return item;
		},

		ChatMessageReaction: (map: any) => {
			const reactions = new Model.ChatMessage.Reactions();

			(map || []).forEach(it => {
				const identities = new Model.ChatMessage.Reactions.IdentityList();

				identities.setIdsList(it.authors);
				reactions.getReactionsMap().set(it.icon, identities);
			});

			return reactions;
		},

	},

	Event: {

		Type (v: number): string {
			const V = Events.Event.Message.ValueCase;

			let t = '';
			if (v == V.ACCOUNTSHOW)					 t = 'AccountShow';
			if (v == V.ACCOUNTDETAILS)				 t = 'AccountDetails';
			if (v == V.ACCOUNTUPDATE)				 t = 'AccountUpdate';
			if (v == V.ACCOUNTCONFIGUPDATE)			 t = 'AccountConfigUpdate';
			if (v == V.ACCOUNTLINKCHALLENGE)		 t = 'AccountLinkChallenge';
			if (v == V.ACCOUNTLINKCHALLENGEHIDE)	 t = 'AccountLinkChallengeHide';

			if (v == V.BLOCKADD)					 t = 'BlockAdd';
			if (v == V.BLOCKDELETE)					 t = 'BlockDelete';
			if (v == V.BLOCKSETFIELDS)				 t = 'BlockSetFields';
			if (v == V.BLOCKSETCHILDRENIDS)			 t = 'BlockSetChildrenIds';
			if (v == V.BLOCKSETBACKGROUNDCOLOR)		 t = 'BlockSetBackgroundColor';
			if (v == V.BLOCKSETTEXT)				 t = 'BlockSetText';
			if (v == V.BLOCKSETFILE)				 t = 'BlockSetFile';
			if (v == V.BLOCKSETLINK)				 t = 'BlockSetLink';
			if (v == V.BLOCKSETBOOKMARK)			 t = 'BlockSetBookmark';
			if (v == V.BLOCKSETALIGN)				 t = 'BlockSetAlign';
			if (v == V.BLOCKSETVERTICALALIGN)		 t = 'BlockSetVerticalAlign';
			if (v == V.BLOCKSETDIV)					 t = 'BlockSetDiv';
			if (v == V.BLOCKSETRELATION)			 t = 'BlockSetRelation';
			if (v == V.BLOCKSETLATEX)				 t = 'BlockSetLatex';
			if (v == V.BLOCKSETTABLEROW)			 t = 'BlockSetTableRow';
			if (v == V.BLOCKSETWIDGET)				 t = 'BlockSetWidget';

			if (v == V.BLOCKDATAVIEWVIEWSET)		 t = 'BlockDataviewViewSet';
			if (v == V.BLOCKDATAVIEWVIEWUPDATE)		 t = 'BlockDataviewViewUpdate';
			if (v == V.BLOCKDATAVIEWVIEWDELETE)		 t = 'BlockDataviewViewDelete';
			if (v == V.BLOCKDATAVIEWVIEWORDER)		 t = 'BlockDataviewViewOrder';

			if (v == V.BLOCKDATAVIEWTARGETOBJECTIDSET)	 t = 'BlockDataviewTargetObjectIdSet';
			if (v == V.BLOCKDATAVIEWISCOLLECTIONSET)	 t = 'BlockDataviewIsCollectionSet';

			if (v == V.BLOCKDATAVIEWRELATIONSET)	 t = 'BlockDataviewRelationSet';
			if (v == V.BLOCKDATAVIEWRELATIONDELETE)	 t = 'BlockDataviewRelationDelete';
			if (v == V.BLOCKDATAVIEWGROUPORDERUPDATE)	 t = 'BlockDataviewGroupOrderUpdate';
			if (v == V.BLOCKDATAVIEWOBJECTORDERUPDATE)	 t = 'BlockDataviewObjectOrderUpdate';

			if (v == V.SUBSCRIPTIONADD)				 t = 'SubscriptionAdd';
			if (v == V.SUBSCRIPTIONREMOVE)			 t = 'SubscriptionRemove';
			if (v == V.SUBSCRIPTIONPOSITION)		 t = 'SubscriptionPosition';
			if (v == V.SUBSCRIPTIONCOUNTERS)		 t = 'SubscriptionCounters';
			if (v == V.SUBSCRIPTIONGROUPS)			 t = 'SubscriptionGroups';

			if (v == V.OBJECTREMOVE)				 t = 'ObjectRemove';
			if (v == V.OBJECTDETAILSSET)			 t = 'ObjectDetailsSet';
			if (v == V.OBJECTDETAILSAMEND)			 t = 'ObjectDetailsAmend';
			if (v == V.OBJECTDETAILSUNSET)			 t = 'ObjectDetailsUnset';
			if (v == V.OBJECTRELATIONSAMEND)		 t = 'ObjectRelationsAmend';
			if (v == V.OBJECTRELATIONSREMOVE)		 t = 'ObjectRelationsRemove';
			if (v == V.OBJECTRESTRICTIONSSET)		 t = 'ObjectRestrictionsSet';
			if (v == V.OBJECTCLOSE)					 t = 'objectClose';

			if (v == V.FILESPACEUSAGE)				 t = 'FileSpaceUsage';
			if (v == V.FILELOCALUSAGE)				 t = 'FileLocalUsage';
			if (v == V.FILELIMITREACHED)			 t = 'FileLimitReached';
			if (v == V.FILELIMITUPDATED)			 t = 'FileLimitUpdated';

			if (v == V.NOTIFICATIONSEND)			 t = 'NotificationSend';
			if (v == V.NOTIFICATIONUPDATE)			 t = 'NotificationUpdate';

			if (v == V.PAYLOADBROADCAST)			 t = 'PayloadBroadcast';
			
			if (v == V.MEMBERSHIPUPDATE)			 t = 'MembershipUpdate';

			if (v == V.PROCESSNEW)					 t = 'ProcessNew';
			if (v == V.PROCESSUPDATE)				 t = 'ProcessUpdate';
			if (v == V.PROCESSDONE)					 t = 'ProcessDone';

			if (v == V.THREADSTATUS) 				 t = 'ThreadStatus';
			if (v == V.SPACESYNCSTATUSUPDATE)		 t = 'SpaceSyncStatusUpdate';
			if (v == V.P2PSTATUSUPDATE)		 		 t = 'P2PStatusUpdate';

			if (v == V.IMPORTFINISH)				 t = 'ImportFinish';

			if (v == V.CHATADD)						 t = 'ChatAdd';
			if (v == V.CHATUPDATE)					 t = 'ChatUpdate';
			if (v == V.CHATDELETE)					 t = 'ChatDelete';
			if (v == V.CHATUPDATEREACTIONS)			 t = 'ChatUpdateReactions';
			if (v == V.CHATSTATEUPDATE)			 	 t = 'ChatStateUpdate';
			if (v == V.CHATUPDATEMESSAGEREADSTATUS)	 t = 'ChatUpdateMessageReadStatus';
			if (v == V.CHATUPDATEMENTIONREADSTATUS)	 t = 'ChatUpdateMentionReadStatus';

			if (v == V.SPACEAUTOWIDGETADDED)		 t = 'SpaceAutoWidgetAdded';

			return t;
		},

		Data (e: any) {
			const type = Mapper.Event.Type(e.getValueCase());
			const fn = `get${U.Common.ucFirst(type)}`;
			const data = e[fn] ? e[fn]() : {};

			return {
				spaceId: e.getSpaceid(),
				data,
			};
		},

		AccountShow: (obj: Events.Event.Account.Show) => {
			return {
				account: Mapper.From.Account(obj.getAccount()),
			};
		},

		AccountUpdate: (obj: Events.Event.Account.Update) => {
			return {
				status: Mapper.From.AccountStatus(obj.getStatus()),
			};
		},

		AccountConfigUpdate: (obj: Events.Event.Account.Config.Update) => {
			return {
				config: Mapper.From.AccountConfig(obj.getConfig()),
			};
		},

		AccountLinkChallenge: (obj: Events.Event.Account.LinkChallenge) => {
			return {
				challenge: obj.getChallenge(),
			};
		},

		AccountLinkChallengeHide: (obj: Events.Event.Account.LinkChallengeHide) => {
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

		BlockDataviewViewDelete: (obj: Events.Event.Block.Dataview.ViewDelete) => {
			return {
				id: obj.getId(),
				viewId: obj.getViewid(),
			};
		},

		BlockDataviewViewOrder: (obj: Events.Event.Block.Dataview.ViewOrder) => {
			return {
				id: obj.getId(),
				viewIds: obj.getViewidsList() || [],
			};
		},

		BlockDataviewRelationDelete: (obj: Events.Event.Block.Dataview.RelationDelete) => {
			return {
				id: obj.getId(),
				relationKeys: obj.getRelationkeysList() || [],
			};
		},

		BlockDataviewRelationSet: (obj: Events.Event.Block.Dataview.RelationSet) => {
			return {
				id: obj.getId(),
				relations: (obj.getRelationlinksList() || []).map(Mapper.From.RelationLink),
			};
		},

		BlockDataviewGroupOrderUpdate: (obj: Events.Event.Block.Dataview.GroupOrderUpdate) => {
			return {
				id: obj.getId(),
				groupOrder: obj.hasGrouporder() ? Mapper.From.GroupOrder(obj.getGrouporder()) : null,
			};
		},

		BlockDataviewObjectOrderUpdate: (obj: Events.Event.Block.Dataview.ObjectOrderUpdate) => {
			return {
				id: obj.getId(),
				groupId: obj.getGroupid(),
				viewId: obj.getViewid(),
				changes: (obj.getSlicechangesList() || []).map(it => {
					return {
						operation: it.getOp(),
						ids: it.getIdsList() || [],
						afterId: it.getAfterid(),
					};
				})
			};
		},

		ObjectDetailsSet: (obj: Events.Event.Object.Details.Set) => {
			return {
				id: obj.getId(),
				subIds: obj.getSubidsList() || [],
				details: Decode.struct(obj.getDetails()),
			};
		},

		ObjectDetailsAmend: (obj: Events.Event.Object.Details.Amend) => {
			const details = {};

			(obj.getDetailsList() || []).forEach(it => {
				details[it.getKey()] = Decode.value(it.getValue());
			});

			return {
				id: obj.getId(),
				subIds: obj.getSubidsList() || [],
				details,
			};
		},

		ObjectDetailsUnset: (obj: Events.Event.Object.Details.Unset) => {
			return {
				id: obj.getId(),
				subIds: obj.getSubidsList() || [],
				keys: obj.getKeysList() || [],
			};
		},

		SubscriptionAdd: (obj: Events.Event.Object.Subscription.Add) => {
			return {
				id: obj.getId(),
				afterId: obj.getAfterid(),
				subId: obj.getSubid(),
			};
		},

		SubscriptionRemove: (obj: Events.Event.Object.Subscription.Remove) => {
			return {
				id: obj.getId(),
				subId: obj.getSubid(),
			};
		},

		SubscriptionPosition: (obj: Events.Event.Object.Subscription.Position) => {
			return {
				id: obj.getId(),
				afterId: obj.getAfterid(),
				subId: obj.getSubid(),
			};
		},

		SubscriptionCounters: (obj: Events.Event.Object.Subscription.Counters) => {
			return {
				total: obj.getTotal(),
				subId: obj.getSubid(),
			};
		},

		SubscriptionGroups: (obj: Events.Event.Object.Subscription.Groups) => {
			return {
				subId: obj.getSubid(),
				group: Mapper.From.BoardGroup(obj.getGroup()),
				remove: obj.getRemove(),
			};
		},

		NotificationSend: (obj: Events.Event.Notification.Send) => {
			return {
				notification: Mapper.From.Notification(obj.getNotification()),
			};
		},

		NotificationUpdate: (obj: Events.Event.Notification.Update) => {
			return {
				notification: Mapper.From.Notification(obj.getNotification()),
			};
		},

		PayloadBroadcast: (obj: Events.Event.Payload.Broadcast) => {
			return {
				payload: obj.getPayload(),
			};
		},

		MembershipUpdate: (obj: Events.Event.Membership.Update) => {
			return {
				membership: Mapper.From.Membership(obj.getData()),
			};
		},

		ProcessNew: (obj: Events.Event.Process.New) => {
			return {
				process: Mapper.From.Process(obj.getProcess()),
			};
		},

		ProcessUpdate: (obj: Events.Event.Process.Update) => {
			return {
				process: Mapper.From.Process(obj.getProcess()),
			};
		},

		ProcessDone: (obj: Events.Event.Process.Done) => {
			return {
				process: Mapper.From.Process(obj.getProcess()),
			};
		},

		SpaceSyncStatusUpdate: (obj: Events.Event.Space.SyncStatus.Update) => {
			return {
				id: obj.getId(),
				error: obj.getError(),
				network: obj.getNetwork(),
				status: obj.getStatus(),
				syncingCounter: obj.getSyncingobjectscounter()
			};
		},

		P2PStatusUpdate: (obj: Events.Event.P2PStatus.Update) => {
			return {
				id: obj.getSpaceid(),
				p2p: obj.getStatus(),
				devicesCounter: obj.getDevicescounter(),
			};
		},

		ImportFinish: (obj: Events.Event.Import.Finish) => {
			return {
				collectionId: obj.getRootcollectionid(),
				count: obj.getObjectscount(),
				type: obj.getImporttype(),
			};
		},

		ChatAdd: (obj: Events.Event.Chat.Add) => {
			return {
				id: obj.getId(),
				orderId: obj.getOrderid(),
				message: Mapper.From.ChatMessage(obj.getMessage()),
				subIds: obj.getSubidsList(),
			};
		},

		ChatUpdate: (obj: Events.Event.Chat.Update) => {
			return {
				id: obj.getId(),
				message: Mapper.From.ChatMessage(obj.getMessage()),
				subIds: obj.getSubidsList(),
			};
		},

		ChatDelete: (obj: Events.Event.Chat.Delete) => {
			return {
				id: obj.getId(),
				subIds: obj.getSubidsList(),
			};
		},

		ChatUpdateReactions: (obj: Events.Event.Chat.UpdateReactions) => {
			return {
				id: obj.getId(),
				reactions: Mapper.From.ChatMessageReaction(obj.getReactions()),
				subIds: obj.getSubidsList(),
			};
		},

		ChatStateUpdate: (obj: Events.Event.Chat.UpdateState) => {
			return {
				state: Mapper.From.ChatState(obj.getState()),
				subIds: obj.getSubidsList(),
			};
		},

		ChatUpdateMessageReadStatus: (obj: Events.Event.Chat.UpdateMessageReadStatus) => {
			return {
				ids: obj.getIdsList(),
				isRead: obj.getIsread(),
				subIds: obj.getSubidsList(),
			};
		},

		ChatUpdateMentionReadStatus: (obj: Events.Event.Chat.UpdateMentionReadStatus) => {
			return {
				ids: obj.getIdsList(),
				isRead: obj.getIsread(),
				subIds: obj.getSubidsList(),
			};
		},

		SpaceAutoWidgetAdded: (obj: Events.Event.Space.AutoWidgetAdded) => {
			return {
				widgetId: obj.getWidgetblockid(),
				targetId: obj.getTargetid(),
				targetName: obj.getTargetname(),
			};
		},

	},

};
