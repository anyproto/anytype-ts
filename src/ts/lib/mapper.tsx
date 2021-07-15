import { I, M, Decode, DataUtil, Util, Encode } from 'ts/lib';

const Commands = require('lib/pb/protos/commands_pb');
const Model = require('lib/pkg/lib/pb/model/protos/models_pb.js');
const Rpc = Commands.Rpc;

const Mapper = {

	From: {

		Account: (obj: any): I.Account => {
			return {
				id: obj.getId(),
			};
		},

		AccountConfig: (obj: any): I.AccountConfig => {
			return {
				allowDataview: obj.getEnabledataview(),
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

		LinkPreview: (obj: any) => {
            return {
                type: obj.getType(),
                title: obj.getTitle(),
                description: obj.getDescription(),
                faviconUrl: obj.getFaviconurl(),
                imageUrl: obj.getImageurl(),
                url: obj.getUrl(),
            };
        },

		BlockType: (v: number): I.BlockType => {
			let t = I.BlockType.Empty;
			let V = Model.Block.ContentCase;

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
			return t;
		},

		Details: (obj: any): any => {
			return {
				id: obj.getId(),
				details: Decode.decodeStruct(obj.getDetails()),
			};
		},
	
		Block: (obj: any): I.Block => {
			let type = Mapper.From.BlockType(obj.getContentCase());
			let fn = 'get' + Util.ucFirst(type);
			let content = obj[fn] ? obj[fn]() : {};
	
			let item: I.Block = {
				id: obj.getId(),
				type: type,
				childrenIds: obj.getChildrenidsList() || [],
				fields: Decode.decodeStruct(obj.getFields()),
				content: {} as any,
				align: obj.getAlign(),
				bgColor: obj.getBackgroundcolor(),
			};
	
			if (type == I.BlockType.Layout) {
				item.content = {
					style: content.getStyle(),
				};
			};
	
			if (type == I.BlockType.Link) {
				item.content = {
					style: content.getStyle(),
					targetBlockId: content.getTargetblockid(),
					fields: Decode.decodeStruct(content.getFields()),
				};
			};
	
			if (type == I.BlockType.Div) {
				item.content = {
					style: content.getStyle(),
				};
			};
	
			if (type == I.BlockType.Bookmark) {
				item.content = {
					url: content.getUrl(),
					title: content.getTitle(),
					description: content.getDescription(),
					imageHash: content.getImagehash(),
					faviconHash: content.getFaviconhash(),
					type: content.getType(),
				};
			};
	
			if (type == I.BlockType.Text) {
				item.content = {
					text: content.getText(),
					style: content.getStyle(),
					checked: content.getChecked(),
					color: content.getColor(),
					marks: (content.getMarks().getMarksList() || []).map(Mapper.From.Mark),
				};
			};
	
			if (type == I.BlockType.File) {
				item.content = {
					hash: content.getHash(),
					name: content.getName(),
					type: content.getType(),
					mime: content.getMime(),
					size: content.getSize(),
					addedAt: content.getAddedat(),
					state: content.getState(),
				};
			};
	
			if (type == I.BlockType.Dataview) {
				item.content = {
					source: content.getSource(),
					views: (content.getViewsList() || []).map(Mapper.From.View),
					relations: (content.getRelationsList() || []).map(Mapper.From.Relation),
				};
			};

			if (type == I.BlockType.Relation) {
				item.content = {
					key: content.getKey(),
				};
			};
	
			return item;
		},

		Restrictions: (obj: any): any => {
			if (!obj) {
				return {
					object: [],
					dataview: [],
				};
			};

			return {
				object: obj.getObjectList() || [],
				dataview: (obj.getDataviewList() || []).map(Mapper.From.RestrictionsDataview),
			};
		},

		RestrictionsDataview: (obj: any): any => {
			return {
				blockId: obj.getBlockid(),
				restrictions: obj.getRestrictionsList() || [],
			};
		},

		ObjectType: (obj: any): I.ObjectType => {
			return {
				id: obj.getUrl(),
				name: obj.getName(),
				description: obj.getDescription(),
				layout: obj.getLayout(),
				iconEmoji: obj.getIconemoji(),
				isHidden: obj.getHidden(),
				isArchived: obj.getIsarchived(),
				isReadonly: obj.getReadonly(),
				types: obj.getTypesList(),
				relations: (obj.getRelationsList() || []).map(Mapper.From.Relation),
			};
		},

		Relation: (obj: any): I.Relation => {
			return {
				objectId: '',
				relationKey: obj.getKey(),
				format: obj.getFormat(),
				name: obj.getName(),
				dataSource: obj.getDatasource(),
				isHidden: obj.getHidden(),
				isReadonlyValue: obj.getReadonly(),
				isReadonlyRelation: obj.getReadonlyrelation(),
				maxCount: obj.getMaxcount(),
				objectTypes: obj.getObjecttypesList(),
				scope: obj.getScope(),
				selectDict: (obj.getSelectdictList() || []).map(Mapper.From.SelectOption),
			};
		},

		SelectOption: (obj: any) => {
			return {
				id: obj.getId(),
				text: obj.getText(),
				color: obj.getColor(),
				scope: obj.getScope(),
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
				relationKey: obj.getRelationkey(),
				operator: obj.getOperator(),
				condition: obj.getCondition(),
				value: obj.hasValue() ? Decode.decodeValue(obj.getValue()) : null,
			};
		},

		Sort: (obj: any): I.Sort => {
			return {
				relationKey: obj.getRelationkey(),
				type: obj.getType(),
			};
		},

		View: (obj: any): I.View => {
			return {
				id: obj.getId(),
				type: obj.getType(),
				name: obj.getName(),
				sorts: obj.getSortsList().map(Mapper.From.Sort),
				filters: obj.getFiltersList().map(Mapper.From.Filter),
				relations: obj.getRelationsList().map(Mapper.From.ViewRelation),
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

    },

	//------------------------------------------------------------

	To: {

		Range: (obj: any) => {
			let ret = new Model.Range();
			ret.setFrom(obj.from);
			ret.setTo(obj.to);
			return ret;
		},

		Mark: (obj: any) => {
			const item = new Model.Block.Content.Text.Mark();
			item.setType(obj.type);
			item.setParam(obj.param);
			item.setRange(Mapper.To.Range(obj.range));
			return item;
		},

		Details: (obj: any) => {
			const item = new Rpc.Block.Set.Details.Detail();
			item.setKey(obj.key);
			item.setValue(Encode.encodeValue(obj.value));
			return item;
		},

		Fields: (obj: any) => {
			const item = new Rpc.BlockList.Set.Fields.Request.BlockField();
			item.setBlockid(obj.blockId);
			item.setFields(Encode.encodeStruct(obj.fields || {}));
			return item;
		},

		Block: (obj: any) => {
			obj.content = Util.objectCopy(obj.content || {});
	
			let block = new Model.Block();
			let content: any = null;
	
			block.setId(obj.id);
			block.setAlign(obj.align);
			block.setBackgroundcolor(obj.bgColor);
	
			if (obj.childrenIds) {
				block.setChildrenidsList(obj.childrenIds);
			};
	
			if (obj.fields) {
				block.setFields(Encode.encodeStruct(obj.fields || {}));
			};

			if (obj.type == I.BlockType.Layout) {
                content = new Model.Block.Content.Layout();

                content.setStyle(obj.content.style);
    
                block.setLayout(content);
            };
	
			if (obj.type == I.BlockType.Text) {
				const marks = (obj.content.marks || []).map(Mapper.To.Mark);
	
				content = new Model.Block.Content.Text();
	
				content.setText(obj.content.text);
				content.setStyle(obj.content.style);
				content.setChecked(obj.content.checked);
				content.setColor(obj.content.color);
				content.setMarks(new Model.Block.Content.Text.Marks().setMarksList(marks));
	
				block.setText(content);
			};
	
			if (obj.type == I.BlockType.File) {
				content = new Model.Block.Content.File();
	
				content.setHash(obj.content.hash);
				content.setName(obj.content.name);
				content.setType(obj.content.type);
				content.setMime(obj.content.mime);
				content.setSize(obj.content.size);
				content.setAddedat(obj.content.addedAt);
				content.setState(obj.content.state);
	
				block.setFile(content);
			};
	
			if (obj.type == I.BlockType.Bookmark) {
				content = new Model.Block.Content.Bookmark();
	
				content.setUrl(obj.content.url);
				content.setTitle(obj.content.title);
				content.setDescription(obj.content.description);
				content.setImagehash(obj.content.imageHash);
				content.setFaviconhash(obj.content.faviconHash);
				content.setType(obj.content.type);
	
				block.setBookmark(content);
			};

			if (obj.type == I.BlockType.Link) {
				content = new Model.Block.Content.Link();
	
				content.setStyle(obj.content.style);
				content.setTargetblockid(obj.content.targetBlockId);
	
				block.setLink(content);
			};

			if (obj.type == I.BlockType.Div) {
				content = new Model.Block.Content.Div();

				content.setStyle(obj.content.style);
	
				block.setDiv(content);
			};

			if (obj.type == I.BlockType.Relation) {
				content = new Model.Block.Content.Relation();

				content.setKey(obj.content.key);
	
				block.setRelation(content);
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
			
			item.setRelationkey(obj.relationKey);
			item.setOperator(obj.operator);
			item.setCondition(obj.condition);
			item.setValue(Encode.encodeValue(obj.value));

			return item;
		},

		Sort: (obj: any) => {
			const item = new Model.Block.Content.Dataview.Sort();
			
			item.setRelationkey(obj.relationKey);
			item.setType(obj.type);

			return item;
		},

		View: (obj: I.View) => {
			obj = Util.objectCopy(new M.View(obj));

			const item = new Model.Block.Content.Dataview.View();

			item.setId(obj.id);
			item.setName(obj.name);
			item.setType(obj.type);
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

		ObjectType: (obj: any) => {
			const item = new Model.ObjectType();
			
			item.setUrl(obj.id);
			item.setName(obj.name);
			item.setLayout(obj.layout);
			item.setIconemoji(obj.iconEmoji);
			item.setHidden(obj.isHidden);
			item.setRelationsList((obj.relations || []).map(Mapper.To.Relation));

			return item;
		},

		Relation: (obj: any) => {
			const item = new Model.Relation();
			
			item.setKey(obj.relationKey);
			item.setFormat(obj.format);
			item.setName(obj.name);
			item.setDefaultvalue(obj.defaultValue);
			item.setDatasource(obj.dataSource);
			item.setHidden(obj.isHidden);
			item.setReadonly(obj.isReadonly);
			item.setMaxcount(obj.maxCount);
			item.setObjecttypesList(obj.objectTypes);
			item.setSelectdictList((obj.selectDict || []).map(Mapper.To.SelectOption));

			return item;
		},

		SelectOption: (obj: any) => {
			const item = new Model.Relation.Option();

			item.setId(obj.id);
			item.setText(obj.text);
			item.setColor(obj.color);

			return item;
		},

	}

};

export default Mapper;