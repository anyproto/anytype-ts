import { dbStore, commonStore, blockStore } from 'Store';
import { I, M, C, Util, DataUtil, Relation } from 'Lib';

const Constant = require('json/constant.json');

class Dataview {

	viewGetRelations (rootId: string, blockId: string, view: I.View): I.ViewRelation[] {
		const { config } = commonStore;

		if (!view) {
			return [];
		};

		let relations = Util.objectCopy(dbStore.getRelations(rootId, blockId, { withHidden: true }));
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
			if (undefined === order[it.relationKey]) {
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

	relationAdd (rootId: string, blockId: string, relationId: string, index: number, view?: I.View, callBack?: (message: any) => void) {
		if (!view) {
			return;
		};

		C.BlockDataviewRelationAdd(rootId, blockId, relationId, (message: any) => {
			if (message.error.code) {
				return;
			};

			let relation = dbStore.getRelationById(relationId);
			let rel = view.getRelation(relation.relationKey);

			if (rel) {
				rel.isVisible = true;
			} else {
				relation.relationKey = relation.relationKey;
				relation.isVisible = true;
				relation.width = Relation.width(0, relation.format);

				if (index >= 0) {
					view.relations.splice(index, 0, relation);
				} else {
					view.relations.push(relation);
				};
			};

			C.BlockDataviewViewUpdate(rootId, blockId, view.id, view, callBack);
		});
	};

	getData (rootId: string, blockId: string, id: string, keys: string[], offset: number, limit: number, clear: boolean, callBack?: (message: any) => void) {
		const view = dbStore.getView(rootId, blockId, id);
		if (!view) {
			return;
		};

		const subId = dbStore.getSubId(rootId, blockId);
		const { viewId } = dbStore.getMeta(subId, '');
		const viewChange = id != viewId;
		const meta: any = { offset: offset };
		const block = blockStore.getLeaf(rootId, blockId);
		const filters = view.filters.concat([
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
		]);

		if (viewChange) {
			meta.viewId = id;
		};
		if (viewChange || clear) {
			dbStore.recordsSet(subId, '', []);
		};

		dbStore.metaSet(subId, '', meta);

		DataUtil.searchSubscribe({
			subId,
			filters,
			sorts: view.sorts,
			keys,
			sources: block.content.sources,
			offset,
			limit,
		});
	};

};

export default new Dataview();