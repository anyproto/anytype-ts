import {dbStore, commonStore, blockStore, detailStore} from 'Store';
import { I, M, C, Util, DataUtil, Relation } from 'Lib';

import Constant from 'json/constant.json';

class Dataview {

	viewGetRelations (rootId: string, blockId: string, view: I.View): I.ViewRelation[] {
		const { config } = commonStore;

		if (!view) {
			return [];
		};

		let relations = Util.objectCopy(dbStore.getObjectRelations(rootId, blockId));
		let order: any = {};
		let o = 0;

		if (!config.debug.ho) {
			relations = relations.filter((it: any) => { 
				return (it.relationKey == 'name') || !it.isHidden; 
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
			
			if (relation.relationKey == 'name') {
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
		const { targetObjectId } = block.content;
		const object = detailStore.get(rootId, targetObjectId ? targetObjectId : rootId, [ 'setOf' ]);

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

		const subId = dbStore.getSubId(rootId, blockId);
		const { viewId } = dbStore.getMeta(subId, '');
		const viewChange = newViewId != viewId;
		const meta: any = { offset };

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
			filters: view.filters.map(mapper),
			sorts: view.sorts.map(mapper),
			keys,
			sources: object.setOf || [],
			limit,
			offset,
			ignoreDeleted: true,
			ignoreHidden: true,
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

	groupUpdate (rootId: string, blockId: string, viewId: string, groups: any[]) {
		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const groupOrder = Util.objectCopy(block.content.groupOrder);
		const idx = groupOrder.findIndex(it => it.viewId == viewId);

		if (idx >= 0) {
			groupOrder[idx].groups = groups;
		} else {
			groupOrder.push({ viewId, groups });
		};

		blockStore.updateContent(rootId, blockId, { groupOrder });
	};

};

export default new Dataview();