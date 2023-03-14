import { I, M, Decode, Util, Encode } from 'Lib';

const Commands = require('lib/pb/protos/commands_pb');
const Model = require('lib/pkg/lib/pb/model/protos/models_pb.js');
const Rpc = Commands.Rpc;

const Mapper = {

	BlockType: (v: number): I.BlockType => {
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
		if (v == V.LATEX)				 t = I.BlockType.Latex;
		if (v == V.TABLE)				 t = I.BlockType.Table;
		if (v == V.TABLECOLUMN)			 t = I.BlockType.TableColumn;
		if (v == V.TABLEROW)			 t = I.BlockType.TableRow;
		if (v == V.TABLEOFCONTENTS)		 t = I.BlockType.TableOfContents;
		if (v == V.WIDGET)		 		 t = I.BlockType.Widget;
		return t;
	},

	BoardGroupType (v: number) {
		const V = Model.Block.Content.Dataview.Group.ValueCase;

		let t = '';
		if (v == V.STATUS)	 t = 'status';
		if (v == V.TAG)		 t = 'tag';
		if (v == V.CHECKBOX) t = 'checkbox';
		if (v == V.DATE)	 t = 'date';
		return t;
	},

	From: {

		Account: (obj: any): I.Account => {
			return {
				id: obj.getId(),
				info: obj.hasInfo() ? Mapper.From.AccountInfo(obj.getInfo()) : null,
				config: obj.hasConfig() ? Mapper.From.AccountConfig(obj.getConfig()) : null,
				status: obj.hasStatus() ? Mapper.From.AccountStatus(obj.getStatus()) : null,
			};
		},

		AccountInfo: (obj: any): I.AccountInfo => {
			return {
				homeObjectId: obj.getHomeobjectid(),
				profileObjectId: obj.getProfileobjectid(),
				gatewayUrl: obj.getGatewayurl(),
				deviceId: obj.getDeviceid(),
				localStoragePath: obj.getLocalstoragepath(),
				accountSpaceId: obj.getAccountspaceid(),
				widgetsId: obj.getWidgetsid(),
			};
		},

		AccountConfig: (obj: any): I.AccountConfig => {
			return {
				allowSpaces: obj.getEnablespaces(),
				allowBeta: obj.getEnableprereleasechannel(),
			};
		},

		AccountStatus: (obj: any): I.AccountStatus => {
			return {
				type: obj.getStatustype(),
				date: obj.getDeletiondate(),
			};
		},
		
		ObjectInfo: (obj: any): I.PageInfo => {
			return {
				id: obj.getId(),
				details: Decode.decodeStruct(obj.getDetails()),
				snippet: obj.getSnippet(),
				hasInboundLinks: obj.getHasinboundlinks(),
			};
		},

		Record: (obj: any): any => {
			return Decode.decodeStruct(obj);
		},

		Range: (obj: any): I.TextRange => {
			return {
				from: obj.getFrom(),
				to: obj.getTo(),
			};
		},

		Mark: (obj: any): I.Mark => {
			return {
				type: obj.getType(),
				param: obj.getParam(),
				range: Mapper.From.Range(obj.getRange()),
			};
		},

		PreviewLink: (obj: any) => {
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
				details: Decode.decodeStruct(obj.getDetails()),
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
				style: obj.getStyle(),
			};
		},

		BlockDiv: (obj: any) => {
			return {
				style: obj.getStyle(),
			};
		},

		BlockLink: (obj: any) => {
			return {
				targetBlockId: obj.getTargetblockid(),
				iconSize: obj.getIconsize(),
				cardStyle: obj.getCardstyle(),
				description: obj.getDescription(),
				relations: obj.getRelationsList() || [],
			};
		},

		BlockBookmark: (obj: any) => {
			return {
				targetObjectId: obj.getTargetobjectid(),
				state: obj.getState(),
				url: obj.getUrl(),
			};
		},

		BlockText: (obj: any) => {
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

		BlockFile: (obj: any) => {
			return {
				hash: obj.getHash(),
				name: obj.getName(),
				type: obj.getType(),
				style: obj.getStyle(),
				mime: obj.getMime(),
				size: obj.getSize(),
				addedAt: obj.getAddedat(),
				state: obj.getState(),
			};
		},

		BlockDataview: (obj: any) => {
			return {
				sources: obj.getSourceList(),
				views: (obj.getViewsList() || []).map(Mapper.From.View),
				relationLinks: (obj.getRelationlinksList() || []).map(Mapper.From.RelationLink),
				groupOrder: (obj.getGroupordersList() || []).map(Mapper.From.GroupOrder),
				objectOrder: (obj.getObjectordersList() || []).map(Mapper.From.ObjectOrder),
				targetObjectId: obj.getTargetobjectid(),
				isCollection: obj.getIscollection(),
			};
		},

		BlockRelation: (obj: any) => {
			return {
				key: obj.getKey(),
			};
		},

		BlockLatex: (obj: any) => {
			return {
				text: obj.getText(),
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
				isHeader: obj.getIsheader(),
			};
		},

		BlockWidget: (obj: any) => {
			return {
				layout: obj.getLayout(),
			};
		},

		Block: (obj: any): I.Block => {
			const cc = obj.getContentCase();
			const type = Mapper.BlockType(obj.getContentCase());
			const fn = 'get' + Util.ucFirst(type);
			const fm = Util.toUpperCamelCase('block-' + type);
			const content = obj[fn] ? obj[fn]() : {};
			const item: I.Block = {
				id: obj.getId(),
				type: type,
				childrenIds: obj.getChildrenidsList() || [],
				fields: Decode.decodeStruct(obj.getFields()),
				hAlign: obj.getAlign(),
				vAlign: obj.getVerticalalign(),
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

		RelationLink: (obj: any): any => {
			return {
				relationKey: obj.getKey(),
				format: obj.getFormat(),
			};
		},

		View: (obj: any): I.View => {
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
			};
		},

		ViewRelation: (obj: any) => {
            return {
                relationKey: obj.getKey(),
                isVisible: obj.getIsvisible(),
                width: obj.getWidth(),
				includeTime: obj.getDateincludetime(),
                timeFormat: obj.getTimeformat(),
				dateFormat: obj.getDateformat(),
            };
        },

		Filter: (obj: any): I.Filter => {
			return {
				id: obj.getId(),
				relationKey: obj.getRelationkey(),
				operator: obj.getOperator(),
				condition: obj.getCondition(),
				quickOption: obj.getQuickoption(),
				value: obj.hasValue() ? Decode.decodeValue(obj.getValue()) : null,
			};
		},

		Sort: (obj: any): I.Sort => {
			return {
				id: obj.getId(),
				relationKey: obj.getRelationkey(),
				type: obj.getType(),
				customOrder: (obj.getCustomorderList() || []).map(Decode.decodeValue),
			};
		},

		HistoryVersion: (obj: any): I.HistoryVersion => {
			return {
				id: obj.getId(),
				previousIds: obj.getPreviousidsList() || [],
				authorId: obj.getAuthorid(),
				authorName: obj.getAuthorname(),
				groupId: obj.getGroupid(),
				time: obj.getTime(),
			};
		},

		ThreadSummary: (obj: any) => {
            return {
                status: Number(obj.getStatus() || I.ThreadStatus.Unknown),
            };
        },

		ThreadCafe: (obj: any) => {
            return {
                status: Number(obj.getStatus() || I.ThreadStatus.Unknown),
                lastPulled: obj.getLastpulled(),
                lastPushSucceed: obj.getLastpushsucceed(),
				files: Mapper.From.ThreadFiles(obj.getFiles()),
            };
        },

		ThreadFiles: (obj: any) => {
            return {
				pinning: obj.getPinning(),
				pinned: obj.getPinned(),
				failed: obj.getFailed(),
				updated: obj.getUpdated(),
            };
        },

		ThreadDevice: (obj: any) => {
            return {
                name: obj.getName(),
				online: obj.getOnline(),
                lastPulled: obj.getLastpulled(),
                lastEdited: obj.getLastedited(),
            };
        },

		ThreadAccount: (obj: any) => {
            return {
				id: obj.getId(),
				name: obj.getName(),
				imageHash: obj.getImagehash(),
				online: obj.getOnline(),
                lastPulled: obj.getLastpulled(),
                lastEdited: obj.getLastedited(),
				devices: (obj.getDevicesList() || []).map(Mapper.From.ThreadDevice),
            };
        },

		GraphEdge: (obj: any) => {
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

		UnsplashPicture: (obj: any) => {
			return {
                id: obj.getId(),
				url: obj.getUrl(),
				artist: obj.getArtist(),
				artistUrl: obj.getArtisturl(),
            };
		},

		ObjectView: (obj: any) => {
			return {
				rootId: obj.getRootid(),
				blocks: (obj.getBlocksList() || []).map(Mapper.From.Block),
				details: (obj.getDetailsList() || []).map(Mapper.From.Details),
				relationLinks: (obj.getRelationlinksList() || []).map(Mapper.From.RelationLink),
				restrictions: Mapper.From.Restrictions(obj.getRestrictions())
			};
		},

		BoardGroup: (obj: any): I.BoardGroup => {
			const type = Mapper.BoardGroupType(obj.getValueCase());
			const field = obj['get' + Util.ucFirst(type)]();

			let value: any = null;
			switch (type) {
				case 'status':
					value = field.getId();
					break;

				case 'tag':
					value = field.getIdsList();
					break;

				case 'checkbox':
					value = field.getChecked();
					break;
			};

			return { 
				id: obj.getId(),
				value,
			};
		},

		GroupOrder: (obj: any) => {
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

		ObjectOrder: (obj: any) => {
			return {
				viewId: obj.getViewid(),
				groupId: obj.getGroupid(),
				objectIds: obj.getObjectidsList() || [],
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
			const item = new Rpc.Object.SetDetails.Detail();

			item.setKey(obj.key);
			item.setValue(Encode.encodeValue(obj.value));

			return item;
		},

		Fields: (obj: any) => {
			const item = new Rpc.Block.ListSetFields.Request.BlockField();

			item.setBlockid(obj.blockId);
			item.setFields(Encode.encodeStruct(obj.fields || {}));

			return item;
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
	
			content.setHash(obj.hash);
			content.setName(obj.name);
			content.setType(obj.type);
			content.setMime(obj.mime);
			content.setSize(obj.size);
			content.setAddedat(obj.addedAt);
			content.setState(obj.state);

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

			return content;
		},

		Block: (obj: any) => {
			obj.content = Util.objectCopy(obj.content || {});
	
			const block = new Model.Block();
	
			block.setId(obj.id);
			block.setAlign(obj.hAlign);
			block.setVerticalalign(obj.vAlign);
			block.setBackgroundcolor(obj.bgColor);
	
			if (obj.childrenIds) {
				block.setChildrenidsList(obj.childrenIds);
			};
	
			if (obj.fields) {
				block.setFields(Encode.encodeStruct(obj.fields || {}));
			};

			const fb = Util.toCamelCase('set-' + obj.type.toLowerCase());
			const fm = Util.toUpperCamelCase('block-' + obj.type);

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
			item.setTimeformat(obj.timeFormat);
			item.setDateformat(obj.dateFormat);

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
			item.setValue(Encode.encodeValue(obj.value));
			item.setIncludetime(obj.includeTime);

			return item;
		},

		Sort: (obj: any) => {
			const item = new Model.Block.Content.Dataview.Sort();
			
			item.setId(obj.id);
			item.setRelationkey(obj.relationKey);
			item.setType(obj.type);
			item.setCustomorderList((obj.customOrder || []).map(Encode.encodeValue));
			item.setFormat(obj.format);
			item.setIncludetime(obj.includeTime);

			return item;
		},

		View: (obj: I.View) => {
			obj = new M.View(Util.objectCopy(obj));
			
			const item = new Model.Block.Content.Dataview.View();

			item.setId(obj.id);
			item.setName(obj.name);
			item.setType(obj.type);
			item.setCoverrelationkey(obj.coverRelationKey);
			item.setGrouprelationkey(obj.groupRelationKey);
			item.setGroupbackgroundcolors(obj.groupBackgroundColors);
			item.setCoverfit(obj.coverFit);
			item.setCardsize(obj.cardSize);
			item.setHideicon(obj.hideIcon);
			item.setPagelimit(obj.pageLimit);
			item.setRelationsList(obj.relations.map(Mapper.To.ViewRelation));
			item.setFiltersList(obj.filters.map(Mapper.To.Filter));
			item.setSortsList(obj.sorts.map(Mapper.To.Sort));

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

			item.setValue(value);

			return item;
		},

		Snapshot: (obj: any) => {
			const item = new Rpc.Object.Import.Request.Snapshot();

			item.setId(obj.id);
			item.setSnapshot(obj.snapshot);

			return item;
		},

	}

};

export default Mapper;