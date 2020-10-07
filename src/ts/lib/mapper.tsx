import { I, M, Decode, Util, Encode, DataUtil } from 'ts/lib';
import { decorate, observable } from 'mobx';
import { dbStore } from 'ts/store';

const Commands = require('lib/pb/protos/commands_pb');
const Constant = require('json/constant.json');
const Model = require('lib/pkg/lib/pb/model/protos/models_pb.js');
const Relation = require('lib/pkg/lib/pb/relation/protos/relation_pb.js');
const Rpc = Commands.Rpc;
const ContentCase = Model.Block.ContentCase;

const Mapper = {

	From: {

		Account: (obj: any): I.Account => {
			return {
				id: obj.getId(),
			};
		},
		
		ObjectInfo: (obj: any): I.PageInfo => {
			return {
				id: obj.getId(),
				details: Decode.decodeStruct(obj.getDetails()),
				snippet: obj.getSnippet(),
				hasInboundLinks: obj.getHasinboundlinks(),
				pageType: obj.getObjecttype(),
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

		LinkPreview: (obj: any): I.LinkPreview => {
			return {
				type: obj.getType(),
				title: obj.getTitle(),
				description: obj.getDescription(),
				faviconUrl: obj.getFaviconurl(),
				imageUrl: obj.getImageurl(),
			};
		},

		BlockType: (v: number): I.BlockType => {
			let t = I.BlockType.Empty;
			if (v == ContentCase.SMARTBLOCK) t = I.BlockType.Page;
			if (v == ContentCase.TEXT)		 t = I.BlockType.Text;
			if (v == ContentCase.FILE)		 t = I.BlockType.File;
			if (v == ContentCase.LAYOUT)	 t = I.BlockType.Layout;
			if (v == ContentCase.DIV)		 t = I.BlockType.Div;
			if (v == ContentCase.BOOKMARK)	 t = I.BlockType.Bookmark;
			if (v == ContentCase.LINK)		 t = I.BlockType.Link;
			if (v == ContentCase.DATAVIEW)	 t = I.BlockType.Dataview;
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
				const source = content.getSource();
				item.content = {
					source: source,
					views: (content.getViewsList() || []).map((view: I.View) => {
						return Mapper.From.View(source, view);
					}),
				};

				decorate(item.content, {
					viewId: observable,
					views: observable,
					data: observable,
				});
			};
	
			return item;
		},

		ObjectType: (obj: any): I.ObjectType => {
			return {
				url: obj.getUrl(),
				name: obj.getName(),
				layout: obj.getLayout(),
				iconEmoji: obj.getIconemoji(),
				relations: (obj.getRelationsList() || []).map(Mapper.From.Relation),
			};
		},

		Relation: (obj: any): I.Relation => {
			return {
				key: obj.getKey(),
				format: obj.getFormat(),
				name: obj.getName(),
				dataSource: obj.getDatasource(),
				isHidden: obj.getHidden(),
				isReadOnly: obj.getReadonly(),
				isMultiple: obj.getMulti(),
				objectType: obj.getObjecttype(),
				options: obj.getSelectdictList(),
			};
		},

		ViewRelation: (obj: any): any => {
			return {
				id: obj.getKey(),
				isVisible: obj.getIsvisible(),
				width: obj.getWidth(),
			};
		},

		Filter: (obj: any): I.Filter => {
			return {
				relationKey: obj.getRelationkey(),
				operator: obj.getOperator(),
				condition: obj.getCondition(),
				value: Decode.decodeValue(obj.getValue()),
			};
		},

		Sort: (obj: any): I.Sort => {
			return {
				relationKey: obj.getRelationkey(),
				type: obj.getType(),
			};
		},

		View: (source: string, obj: any): I.View => {
			let objectType = dbStore.getObjectType(source);
			let relations = [];

			if (objectType && objectType.relations.length) {
				for (let relation of objectType.relations) {
					if (relation.isHidden) {
						continue;
					};
		
					relations.push({
						id: String(relation.id || ''),
						name: String(relation.name || ''),
						type: DataUtil.schemaField(relation.type),
						isReadOnly: Boolean(relation.isReadOnly),
					});
				};
			};

			let view: any = {
				id: obj.getId(),
				type: obj.getType(),
				name: obj.getName(),
			};
	
			view.relations = obj.getRelationsList().map(Mapper.From.ViewRelation);
			view.filters = obj.getFiltersList().map(Mapper.From.Filter);
			view.sorts = obj.getSortsList().map(Mapper.From.Sort);
	
			let order = {};
			for (let i = 0; i < view.relations.length; ++i) {
				order[view.relations[i].id] = i;
			};
	
			view.relations = relations.map((relation: I.Relation) => {
				let rel = view.relations.find((it: any) => { return it.id == relation.id; }) || {};
				return observable({
					...relation,
					isVisible: Boolean(rel.isVisible),
					order: order[relation.id],
					width: Number(rel.width || Constant.size.dataview.cell[relation.type] || Constant.size.dataview.cell.default) || 0,
				});
			});

			view.relations.sort((c1: any, c2: any) => {
				if (c1.order > c2.order) return 1;
				if (c1.order < c2.order) return -1;
				return 0;
			});
	
			return observable(new M.View(view));
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

			return block;
		},

		ViewRelation: (obj: any) => {
			const item = new Model.Block.Content.Dataview.Relation();
			
			item.setKey(obj.id);
			item.setIsvisible(obj.isVisible);
			item.setWidth(obj.width);

			return item;
		},

		Filter: (obj: any) => {
			const item = new Model.Block.Content.Dataview.Filter();
			
			item.setRelationkey(obj.relationKey);
			item.setOperator(obj.operator);
			item.setCondition(obj.condition);
			item.setValue(Encode.encodeValue(obj.value || ''));

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
			const item = new Relation.ObjectType();
			
			item.setUrl(obj.url);
			item.setName(obj.name);
			item.setLayout(obj.layout);
			item.setIconemoji(obj.iconEmoji);
			item.setRelationsList((obj.relations || []).map(Mapper.To.Relation));

			return item;
		},

		Relation: (obj: any) => {
			const item = new Relation.Relation();
			
			item.setKey(obj.key);
			item.setFormat(obj.format);
			item.setName(obj.name);
			item.setDefaultvalue(obj.defaultValue);
			item.setDatasource(obj.dataSource);
			item.setHidden(obj.isHidden);
			item.setReadonly(obj.isReadOnly);
			item.setMulti(obj.isMultiple);
			item.setObjecttype(obj.objectType);
			item.setSelectdictList(obj.options);

			return item;
		},

	}

};

export default Mapper;