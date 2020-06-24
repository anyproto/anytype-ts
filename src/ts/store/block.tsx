import { observable, action, computed, set, intercept, decorate } from 'mobx';
import { I, M, Util, DataUtil, Decode, Encode } from 'ts/lib';

const $ = require('jquery');
const Model = require('lib/vendor/github.com/anytypeio/go-anytype-library/pb/model/protos/models_pb.js');
const Constant = require('json/constant.json');
const Schema = {
	page: require('json/schema/page.json'),
	relation: require('json/schema/relation.json'),
};

class BlockStore {
	@observable public rootId: string = '';
	@observable public archiveId: string = '';
	@observable public profileId: string = '';
	@observable public breadcrumbsId: string = '';

	public treeObject: Map<string, any[]> = new Map();
	public blockObject: Map<string, any[]> = new Map();
	public detailObject: Map<string, Map<string, any>> = new Map();

	@computed
	get root (): string {
		return this.rootId;
	};

	@computed
	get archive (): string {
		return this.archiveId;
	};

	@computed
	get profile (): string {
		return this.profileId;
	};

	@computed
	get breadcrumbs (): string {
		return this.breadcrumbsId;
	};

	@action
	rootSet (id: string) {
		this.rootId = String(id || '');
	};

	@action
	archiveSet (id: string) {
		this.archiveId = String(id || '');
	};

	@action
	profileSet (id: string) {
		this.profileId = String(id || '');
	};

	@action
	breadcrumbsSet (id: string) {
		this.breadcrumbsId = String(id || '');
	};

	@action
	detailsSet (rootId: string, details: any[]) {
		let map = observable(new Map());

		for (let item of details) {
			map.set(item.getId(), Decode.decodeStruct(item.getDetails()));
		};

		intercept(map as any, (change: any) => {
			let item = map.get(change.name);
			if (Util.objectCompare(change.newValue, item)) {
				return null;
			};
			return change;
		});

		this.detailObject.set(rootId, map);
	};

	@action
	detailsUpdate (rootId: string, item: any) {
		if (!item.id || !item.details) {
			return;
		};

		let map = this.detailObject.get(rootId);
		let create = false;

		if (!map) {
			map = observable(new Map());
			create = true;
		};

		map.set(item.id, item.details);

		if (create) {
			intercept(map as any, (change: any) => {
				let item = map.get(change.name);
				if (Util.objectCompare(change.newValue, item)) {
					return null;
				};
				return change;
			});

			this.detailObject.set(rootId, map);
		};
	};

	@action
	blocksSet (rootId: string, blocks: I.Block[]) {
		this.blockObject.set(rootId, blocks);
		this.treeObject.set(rootId, this.getStructure(blocks));
	};

	@action
	blocksClear (rootId: string) {
		this.blockObject.delete(rootId);
		this.treeObject.delete(rootId);
	};

	@action
	blocksClearAll () {
		this.blockObject = new Map();
		this.treeObject = new Map();
		this.detailObject = new Map();
	};

	@action
	blockAdd (rootId: string, block: I.Block) {
		block = new M.Block(block);

		let blocks = this.getBlocks(rootId);
		let map = this.getMap(rootId);

		blocks.push(block);

		map[block.id] = observable({
			parentId: block.parentId,
			childrenIds: block.childrenIds,
		});

		intercept(map[block.id] as any, (change: any) => {
			if (change.newValue === map[block.id][change.name]) {
				return null;
			};
			return change;
		});
	};

	@action
	blockUpdate (rootId: string, param: any) {
		let block = this.getLeaf(rootId, param.id);
		if (!block) {
			return;
		};

		set(block, param);
	};

	@action
	blockUpdateStructure (rootId: string, id: string, childrenIds: string[]) {
		let map = this.getMap(rootId);

		set(map[id], 'childrenIds', childrenIds);

		// Update parentId
		for (let id in map) {
			(map[id].childrenIds || []).map((it: string) => {
				if (map[it]) {
					map[it].parentId = id;
				};
			});
		};
	};

	@action
	blockDelete (rootId: string, id: string) {
		let blocks = this.getBlocks(rootId);
		let map = this.getMap(rootId);

		blocks = blocks.filter((it: any) => { return it.id != id; });
		delete(map[id]);
	};

	getMap (rootId: string) {
		return this.treeObject.get(rootId) || {};
	};

	getLeaf (rootId: string, id: string): any {
		let blocks = this.getBlocks(rootId);
		return blocks.find((it: any) => { return it.id == id; });
	};

	getBlocks (rootId: string, filter?: (it: any) => boolean) {
		let blocks = this.blockObject.get(rootId) || [];

		if (!filter) {
			return blocks;
		};

		return blocks.filter((it: any) => {
			if (filter) {
				return filter(it);
			};
			return true;
		});
	};

	getChildrenIds (rootId: string, id: string): string[] {
		const map = this.getMap(rootId);
		const element = map[id] || {};

		return element.childrenIds || [];
	};

	getChildren (rootId: string, id: string, filter?: (it: any) => boolean) {
		let blocks = this.getBlocks(rootId);
		let childrenIds = this.getChildrenIds(rootId, id);
		
		let childBlocks = childrenIds.map((it: string) => {
			return blocks.find((item: any) => { return item.id == it; });
		}).filter((it: any) => {
			if (!it) {
				return false;
			};
			if (filter) {
				return filter(it);
			};
			return true;
		});
		return childBlocks;
	};

	// If check is present - find next block if check passes or continue to next block in "dir" direction, else just return next block;
	getNextBlock (rootId: string, id: string, dir: number, check?: (item: I.Block) => any, list?: any): any {
		if (!list) {
			list = this.unwrapTree([ this.wrapTree(rootId) ]);
		};

		let idx = list.findIndex((item: I.Block) => { return item.id == id; });
		if (idx + dir < 0 || idx + dir > list.length - 1) {
			return null;
		};

		let ret = list[idx + dir];
		if (check && ret) {
			return check(ret) ? ret : this.getNextBlock(rootId, ret.id, dir, check, list);
		} else {
			return ret;
		};
	};

	getFirstBlock (rootId: string, dir: number, check: (item: I.Block) => any): I.Block {
		const list = this.unwrapTree([ this.wrapTree(rootId) ]).filter(check);
		return dir > 0 ? list[0] : list[list.length - 1];
	};

	setNumbers (rootId: string) {
		const root = this.wrapTree(rootId);
		if (!root) {
			return;
		};

		const cb = (list: any[]) => {
			list = list || [];

			let n = 0;
			for (let item of list) {
				if (!item.isLayout()) {
					if (item.isNumbered()) {
						n++;
						$('#marker-' + item.id).text(`${n}.`);
					} else {
						n = 0;
					};
				};

				cb(item.childBlocks);
			};
		};

		window.setTimeout(() => { cb(root.childBlocks); }, 10);
	};

	getStructure (list: I.Block[]) {
		list = Util.objectCopy(list || []);

		let map: any = {};

		list.map((item: any) => {
			map[item.id] = observable({
				parentId: '',
				childrenIds: item.childrenIds || [],
			});
		});

		for (let id in map) {
			(map[id].childrenIds || []).map((it: string) => {
				if (map[it]) {
					map[it].parentId = id;
				};
			});
		};

		return map;
	};

	getTree (rootId: string, list: I.Block[]): I.Block[] {
		list = Util.objectCopy(list || []);

		let map: any = {};

		for (let item of list) {
			map[item.id] = item;
		};

		for (let item of list) {
			let element = map[item.id];
			if (!element) {
				continue;
			};

			let childBlocks = element.childBlocks || [];
			let childrenIds = item.childrenIds || [];

			for (let id of childrenIds) {
				const child = map[id];
				if (!child) {
					continue;
				};

				child.parentId = item.id;
				childBlocks.push(child);
			};

			map[item.id].childBlocks = Util.arrayUniqueObjects(childBlocks, 'id');
		};

		return (map[rootId] || {}).childBlocks || [];
	};

	wrapTree (rootId: string) {
		let map = this.getMap(rootId);
		let ret: any = {};
		for (let id in map) {
			ret[id] = this.getLeaf(rootId, id);
			ret[id].parentId = String(map[id].parentId || '');
			ret[id].childBlocks = this.getChildren(rootId, id);
		};
		return ret[rootId];
	};

	unwrapTree (tree: any[]): any[] {
		tree = tree || [];

		let ret = [] as I.Block[];
		for (let item of tree) {
			let cb = item.childBlocks;
			delete(item.childBlocks);

			ret.push(item);
			if (cb && cb.length) {
				ret = ret.concat(this.unwrapTree(cb));
			};
		};
		return ret;
	};

	getDetailsMap (rootId: string) {
		return this.detailObject.get(rootId) || new Map();
	};

	getDetails (rootId: string, id: string): any {
		const map = this.getDetailsMap(rootId);
		const item = Util.objectCopy(map.get(id) || {});

		item.name = String(item.name || Constant.default.name);
		return item;
	};

	blockType (v: number): I.BlockType {
		let t = I.BlockType.Empty;
		let V = Model.Block.ContentCase;

		if (v == V.SMARTBLOCK)	 t = I.BlockType.Page;
		if (v == V.TEXT)		 t = I.BlockType.Text;
		if (v == V.FILE)		 t = I.BlockType.File;
		if (v == V.LAYOUT)		 t = I.BlockType.Layout;
		if (v == V.DIV)			 t = I.BlockType.Div;
		if (v == V.BOOKMARK)	 t = I.BlockType.Bookmark;
		if (v == V.LINK)		 t = I.BlockType.Link;
		if (v == V.DATAVIEW)	 t = I.BlockType.Dataview;

		return t;
	};

	prepareBlockFromProto (block: any): I.Block {
		console.log(block, block.getContentCase(), this.blockType(block.getContentCase()));

		let type = this.blockType(block.getContentCase());
		let fn = 'get' + Util.ucFirst(type);
		let content = block[fn] ? block[fn]() : {};

		let item: I.Block = {
			id: block.getId(),
			type: type,
			childrenIds: block.getChildrenidsList() || [],
			fields: Decode.decodeStruct(block.getFields()),
			content: {} as any,
			align: block.getAlign(),
			bgColor: block.getBackgroundcolor(),
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
				marks: (content.getMarks().getMarksList() || []).map((mark: any) => {
					const range = mark.getRange();
					return {
						type: mark.getType(),
						param: mark.getParam(),
						range: {
							from: range.getFrom(),
							to: range.getTo(),
						},
					};
				}),
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

		/*
			if (type == I.BlockType.Dataview) {
				const schemaId = DataUtil.schemaField(item.content.schemaURL);

				item.content.offset = 0;
				item.content.total = 0;
				item.content.data = item.content.data || [];
				item.content.views = item.content.views || [];
				item.content.views = item.content.views.map((view: I.View) => {
					return this.prepareViewFromProto(schemaId, view);
				});

				decorate(item.content, {
					viewId: observable,
					views: observable,
					data: observable,
				});
			};
		*/

		console.log(item);

		return item;
	};

	prepareViewFromProto (schemaId: string, view: I.View) {
		let schema = Schema[schemaId];
		let relations = [];

		for (let field of schema.default) {
			if (field.isHidden) {
				continue;
			};

			relations.push({
				id: String(field.id || ''),
				name: String(field.name || ''),
				type: DataUtil.schemaField(field.type),
				isReadOnly: Boolean(field.isReadonly),
			});
		};

		view.filters = view.filters.map((filter: I.Filter) => {
			return {
				relationId: String(filter.relationId || ''),
				operator: Number(filter.operator) || 0,
				condition: Number(filter.condition) || 0,
				value: filter.value ? Decode.decodeValue(filter.value) : '',
			};
		});

		view.sorts = view.sorts.map((sort: I.Sort) => {
			return {
				relationId: String(sort.relationId || ''),
				type: Number(sort.type) || 0,
			};
		});

		let order = {};
		for (let i = 0; i < view.relations.length; ++i) {
			order[view.relations[i].id] = i;
		};

		view.relations = relations.map((relation: I.Relation) => {
			let rel = view.relations.find((it: any) => { return it.id == relation.id; }) || {};
			return {
				...relation,
				isVisible: Boolean(rel.isVisible),
				order: order[relation.id],
			};
		});

		view.relations.sort((c1: any, c2: any) => {
			if (c1.order > c2.order) return 1;
			if (c1.order < c2.order) return -1;
			return 0;
		});

		return observable(new M.View(view));
	};

	prepareBlockToProto (data: any) {
		data.content = Util.objectCopy(data.content || {});

		let block = new Model.Block();
		let content: any = null;

		block.setId(data.id);
		block.setAlign(data.align);
		block.setBackgroundcolor(data.bgColor);

		if (data.childrenIds) {
			block.setChildrenidsList(data.childrenIds);
		};

		if (data.fields) {
			block.setFields(Encode.encodeStruct(data.fields || {}));
		};

		if (data.type == I.BlockType.Text) {
			const marks = (data.content.marks || []).map((it: any) => {
				const item = new Model.Block.Content.Text.Mark();
				item.setType(it.type);
				item.setParam(it.param);
				item.setRange(new Model.Range().setFrom(it.range.from).setTo(it.range.to));
				return item;
			});

			content = new Model.Block.Content.Text();

			content.setText(data.content.text);
			content.setStyle(data.content.style);
			content.setChecked(data.content.checked);
			content.setColor(data.content.color);
			content.setMarks(new Model.Block.Content.Text.Marks().setMarksList(marks));

			block.setText(content);
		};

		if (data.type == I.BlockType.File) {
			content = new Model.Block.Content.File();

			content.setHash(data.content.hash);
			content.setName(data.content.name);
			content.setType(data.content.type);
			content.setMime(data.content.mime);
			content.setSize(data.content.size);
			content.setAddedat(data.content.addedAt);
			content.setState(data.content.state);

			block.setFile(content);
		};

		if (data.type == I.BlockType.Bookmark) {
			content = new Model.Block.Content.Bookmark();

			content.setUrl(data.content.url);
			content.setTitle(data.content.title);
			content.setDescription(data.content.description);
			content.setImagehash(data.content.imageHash);
			content.setFaviconhash(data.content.faviconHash);
			content.setType(data.content.type);

			block.setBookmark(content);
		};

		return block;
	};

	prepareViewToProto (view: I.View) {
		if (view.filters && view.filters.length) {
			view.filters = view.filters.map((filter: I.Filter) => {
				filter.value = Encode.encodeValue(filter.value || '');
				return filter;
			});
		};
		return view;
	};
};

export let blockStore: BlockStore = new BlockStore();
