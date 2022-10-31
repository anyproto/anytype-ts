import { dbStore, commonStore, blockStore } from 'Store';
import { I, M, C, Util, DataUtil, Relation } from 'Lib';

const Constant = require('json/constant.json');

class Dataview {

	viewGetRelations (rootId: string, blockId: string, view: I.View): I.ViewRelation[] {
		const { config } = commonStore;

		if (!view) {
			return [];
		};

		let relations = Util.objectCopy(dbStore.getRelations(rootId, blockId));
		let order: any = {};
		let o = 0;

		if (!config.debug.ho) {
			relations = relations.filter((it: any) => { 
				if ([ Constant.relationKey.name ].includes(it.relationKey)) {
					return true;
				};
				return !it.isHidden; 
			});
		};

		view.relations.forEach((it: any) => {
			order[it.relationKey] = o++;
		});

		relations.forEach((it: any) => {
			if (it && (undefined === order[it.relationKey])) {
				order[it.relationKey] = o++;
			};
		});

		relations.sort((c1: any, c2: any) => {
			let o1 = order[c1.relationKey];
			let o2 = order[c2.relationKey];
			if (o1 > o2) return 1;
			if (o1 < o2) return -1;
			return 0;
		});

		let ret = relations.map((relation: any) => {
			const vr = view.relations.find(it => it.relationKey == relation.relationKey) || {};
			
			if ([ Constant.relationKey.name ].indexOf(relation.relationKey) >= 0) {
				vr.isVisible = true;
			};

			return new M.ViewRelation({
				...vr,
				relationKey: relation.relationKey,
				width: Relation.width(vr.width, relation.format),
			});
		});

		return Util.arrayUniqueObjects(ret, 'relationKey');
	};

	relationAdd (rootId: string, blockId: string, relationKeys: string[], index: number, view?: I.View, callBack?: (message: any) => void) {
		if (!view) {
			return;
		};

		C.BlockDataviewRelationAdd(rootId, blockId, relationKeys, (message: any) => {
			if (message.error.code) {
				return;
			};

			relationKeys.forEach((relationKey: string) => {
				let rel: any = view.getRelation(relationKey);

				if (rel) {
					rel.isVisible = true;
				} else {
					rel = { 
						relationKey,
						width: Constant.size.dataview.cell.default,
						isVisible: true,
					};

					if (index >= 0) {
						view.relations.splice(index, 0, rel);
					} else {
						view.relations.push(rel);
					};
				};

			});

			C.BlockDataviewViewUpdate(rootId, blockId, view.id, view, callBack);
		});
	};

	getData (param: any, callBack?: (message: any) => void) {
		param = Object.assign({
			rootId: '',
			blockId: '',
			newViewId: '',
			keys: Constant.defaultRelationKeys,
			offset: 0,
			limit: 0,
			ignoreWorkspace: false,
			clear: false,
		}, param);

		const { rootId, blockId, newViewId, keys, offset, limit, clear } = param;
		const view = dbStore.getView(rootId, blockId, newViewId);
		const block = blockStore.getLeaf(rootId, blockId);

		if (!view || !block) {
			return;
		};

		const mapper = (it: any) => {
			const relation = dbStore.getRelationByKey(it.relationKey);
			const vr = view.getRelation(it.relationKey);

			if (relation) {
				it.format = relation.format;
			};
			if (vr) {
				it.includeTime = vr.includeTime;
			};
			return it;
		};

		const { config } = commonStore;
		const subId = dbStore.getSubId(rootId, blockId);
		const { viewId } = dbStore.getMeta(subId, '');
		const viewChange = newViewId != viewId;
		const meta: any = { offset };
		const filters = view.filters.concat([
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
		]);

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false });
		};

		if (viewChange) {
			meta.viewId = newViewId;
		};
		if (viewChange || clear) {
			dbStore.recordsSet(subId, '', []);
		};

		dbStore.metaSet(subId, '', meta);

		DataUtil.searchSubscribe({
			param,
			subId,
			filters: filters.map(mapper),
			sorts: view.sorts.map(mapper),
			keys,
			sources: block.content.sources,
			offset,
		}, callBack);
	};

	getMenuTabs (rootId: string, blockId: string, viewId: string): I.MenuTab[] {
		const view = dbStore.getView(rootId, blockId, viewId);
		if (!view) {
			return [];
		};

		const tabs: I.MenuTab[] = [
			{ id: 'relation', name: 'Relations', component: 'dataviewRelationList' },
			(view.type == I.ViewType.Board) ? { id: 'group', name: 'Groups', component: 'dataviewGroupList' } : null,
			{ id: 'view', name: 'View', component: 'dataviewViewEdit' },
		];
		return tabs.filter(it => it);
	};

};

export default new Dataview();