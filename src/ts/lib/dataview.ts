import arrayMove from 'array-move';
import { dbStore, commonStore, blockStore, detailStore } from 'Store';
import { I, M, C, UtilCommon, UtilData, UtilObject, Relation, translate, UtilDate } from 'Lib';
const Constant = require('json/constant.json');

class Dataview {

	viewGetRelations (rootId: string, blockId: string, view: I.View): I.ViewRelation[] {
		const { config } = commonStore;

		if (!view) {
			return [];
		};

		const order: any = {};

		let relations = UtilCommon.objectCopy(dbStore.getObjectRelations(rootId, blockId)).filter(it => it);
		let o = 0;

		if (!config.debug.hiddenObject) {
			relations = relations.filter(it => (it.relationKey == 'name') || !it.isHidden);
		};

		(view.relations || []).filter(it => it).forEach(it => {
			order[it.relationKey] = o++;
		});

		relations.forEach(it => {
			if (it && (undefined === order[it.relationKey])) {
				order[it.relationKey] = o++;
			};
		});

		relations.sort((c1: any, c2: any) => {
			const o1 = order[c1.relationKey];
			const o2 = order[c2.relationKey];

			if (o1 > o2) return 1;
			if (o1 < o2) return -1;
			return 0;
		});

		const ret = relations.filter(it => it).map(relation => {
			const vr = (view.relations || []).filter(it => it).find(it => it.relationKey == relation.relationKey) || {};

			if (relation.relationKey == 'name') {
				vr.isVisible = true;
			};

			return new M.ViewRelation({
				...vr,
				relationKey: relation.relationKey,
				width: Relation.width(vr.width, relation.format),
			});
		});

		return UtilCommon.arrayUniqueObjects(ret, 'relationKey');
	};

	relationAdd (rootId: string, blockId: string, relationKey: string, index: number, view?: I.View, callBack?: (message: any) => void) {
		if (!view) {
			return;
		};

		C.BlockDataviewRelationAdd(rootId, blockId, [ relationKey ], (message: any) => {
			if (message.error.code) {
				return;
			};

			const rel: any = view.getRelation(relationKey) || {};

			rel.relationKey = relationKey;
			rel.width = rel.width || Constant.size.dataview.cell.default;
			rel.isVisible = true;

			C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, relationKey, rel, (message: any) => {
				if (index >= 0) {
					const newView = dbStore.getView(rootId, blockId, view.id);
					const oldIndex = (newView.relations || []).findIndex(it => it.relationKey == relationKey);
					
					let keys = newView.relations.map(it => it.relationKey);
					if (oldIndex < 0) {
						keys.splice(index, 0, relationKey);
					} else {
						keys = arrayMove(keys, oldIndex, index);
					};

					C.BlockDataviewViewRelationSort(rootId, blockId, view.id, keys, callBack);
				} else {
					if (callBack) {
						callBack(message);
					};
				};
			});
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
			sources: [],
			clear: false,
			collectionId: '',
			filters: [],
			sorts: [],
		}, param);

		const { rootId, blockId, newViewId, keys, offset, limit, clear, collectionId } = param;
		const block = blockStore.getLeaf(rootId, blockId);
		const view = dbStore.getView(rootId, blockId, newViewId);
		
		if (!view) {
			return;
		};

		const subId = dbStore.getSubId(rootId, blockId);
		const { viewId } = dbStore.getMeta(subId, '');
		const viewChange = newViewId != viewId;
		const meta: any = { offset };
		const filters = UtilCommon.objectCopy(view.filters).concat(param.filters || []);
		const sorts = UtilCommon.objectCopy(view.sorts).concat(param.sorts || []);

		filters.push({ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.excludeFromSet() });

		if (viewChange) {
			meta.viewId = newViewId;
		};
		if (viewChange || clear) {
			dbStore.recordsSet(subId, '', []);
		};

		dbStore.metaSet(subId, '', meta);

		if (block) {
			const el = block.content.objectOrder.find(it => (it.viewId == view.id) && (it.groupId == ''));
			const objectIds = el ? el.objectIds || [] : [];

			if (objectIds.length) {
				sorts.unshift({ relationKey: '', type: I.SortType.Custom, customOrder: objectIds });
			};
		};

		UtilData.searchSubscribe({
			...param,
			subId,
			filters: filters.map(it => this.filterMapper(view, it)),
			sorts: sorts.map(it => this.filterMapper(view, it)),
			keys,
			limit,
			offset,
			collectionId,
			ignoreDeleted: true,
			ignoreHidden: true,
		}, callBack);
	};

	filterMapper (view: any, it: any) {
		const relation = dbStore.getRelationByKey(it.relationKey);
		const vr = view.getRelation(it.relationKey);

		if (relation) {
			it.format = relation.format;
		};
		if (vr && vr.includeTime) {
			it.includeTime = true;
		};

		return it;
	};

	getView (rootId: string, blockId: string, viewId?: string): I.View {
		const views = dbStore.getViews(rootId, blockId);
		if (!views.length) {
			return null;
		};

		viewId = viewId || dbStore.getMeta(dbStore.getSubId(rootId, blockId), '').viewId;
		return dbStore.getView(rootId, blockId, viewId) || views[0];
	};

	isCollection (rootId: string, blockId: string): boolean {
		const object = detailStore.get(rootId, rootId, [ 'layout' ], true);
		const isInline = !UtilObject.getSystemLayouts().includes(object.layout);

		if (!isInline) {
			return object.layout == I.ObjectLayout.Collection;
		};

		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return false;
		};

		const { targetObjectId, isCollection } = block.content;
		const target = targetObjectId ? detailStore.get(rootId, targetObjectId, [ 'layout' ], true) : null;

		return target ? target.layout == I.ObjectLayout.Collection : isCollection;
	};

	groupUpdate (rootId: string, blockId: string, viewId: string, groups: any[]) {
		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const el = block.content.groupOrder.find(it => it.viewId == viewId);
		if (el) {
			el.groups = groups;
		};

		blockStore.updateContent(rootId, blockId, block.content);
	};

	groupOrderUpdate (rootId: string, blockId: string, viewId: string, groups: any[]) {
		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const groupOrder = UtilCommon.objectCopy(block.content.groupOrder);
		const idx = groupOrder.findIndex(it => it.viewId == viewId);

		if (idx >= 0) {
			groupOrder[idx].groups = groups;
		} else {
			groupOrder.push({ viewId, groups });
		};

		blockStore.updateContent(rootId, blockId, { groupOrder });
	};

	applyObjectOrder (rootId: string, blockId: string, viewId: string, groupId: string, records: string[]): string[] {
		records = records || [];

		if (!viewId || !records.length) {
			return records;
		};

		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return records;
		};

		const el = block.content.objectOrder.find(it => (it.viewId == viewId) && (groupId ? it.groupId == groupId : true));
		if (!el) {
			return records;
		};

		const objectIds = el.objectIds || [];

		records.sort((c1: any, c2: any) => {
			const idx1 = objectIds.indexOf(c1);
			const idx2 = objectIds.indexOf(c2);

			if (idx1 > idx2) return 1;
			if (idx1 < idx2) return -1;
			return 0;
		});

		return records;
	};

	defaultViewName (type: I.ViewType): string {
		return translate(`viewName${type}`);
	};

	getDetails (rootId: string, blockId: string, objectId: string, viewId?: string, groupId?: string): any {
		const relations = Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Relation);
		const view = this.getView(rootId, blockId, viewId);
		const conditions = [
			I.FilterCondition.Equal,
			I.FilterCondition.GreaterOrEqual,
			I.FilterCondition.LessOrEqual,
			I.FilterCondition.In,
			I.FilterCondition.AllIn,
		];
		const details: any = {};

		let group = null;

		if (groupId) {
			group = dbStore.getGroup(rootId, blockId, groupId);
			if (group) {
				details[view.groupRelationKey] = group.value;
			};
		};

		if (relations.length) {
			relations.forEach((it: any) => {
				details[it.relationKey] = Relation.formatValue(it, null, true);
			});
		};

		if ((view.type == I.ViewType.Calendar) && view.groupRelationKey) {
			details[view.groupRelationKey] = UtilDate.now();
		};

		for (const filter of view.filters) {
			if (!conditions.includes(filter.condition)) {
				continue;
			};

			const value = Relation.getTimestampForQuickOption(filter.value, filter.quickOption);
			if (!value) {
				continue;
			};

			const relation = dbStore.getRelationByKey(filter.relationKey);
			if (relation && !relation.isReadonlyValue) {
				details[filter.relationKey] = Relation.formatValue(relation, value, true);
			};
		};

		return details;
	};

	getTypeId (rootId: string, blockId: string, objectId: string, viewId?: string) {
		const view = this.getView(rootId, blockId, viewId);
		const types = Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Type);
		const relations = Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Relation);
		const isAllowedDefaultType = this.isCollection(rootId, blockId) || !!Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Relation).map(it => it.id).length;

		let typeId = '';
		if (types.length) {
			typeId = types[0].id;
		} else
		if (relations.length) {
			for (const item of relations) {
				if (item.objectTypes.length) {
					const first = dbStore.getTypeById(item.objectTypes[0]);

					if (first && !UtilObject.isFileLayout(first.recommendedLayout) && !UtilObject.isSystemLayout(first.recommendedLayout)) {
						typeId = first.id;
						break;
					};
				};
			};
		};
		if (view && view.defaultTypeId && isAllowedDefaultType) {
			typeId = view.defaultTypeId;
		};
		if (!typeId) {
			typeId = commonStore.type;
		};

		return typeId;
	};

	getCreateTooltip (rootId: string, blockId: string, objectId: string, viewId: string): string {
		const isCollection = this.isCollection(rootId, blockId);

		if (isCollection) {
			return translate('blockDataviewCreateNewTooltipCollection');
		} else {
			const typeId = this.getTypeId(rootId, blockId, objectId, viewId);
			const type = dbStore.getTypeById(typeId);

			if (type) {
				return UtilCommon.sprintf(translate('blockDataviewCreateNewTooltipType'), type.name);
			};
		};
		return translate('blockDataviewCreateNew');
	};

	viewUpdate (rootId: string, blockId: string, viewId: string, param: Partial<I.View>, callBack?: (message: any) => void) {
		const view = UtilCommon.objectCopy(dbStore.getView(rootId, blockId, viewId));
		if (view) {
			C.BlockDataviewViewUpdate(rootId, blockId, view.id, Object.assign(view, param), callBack);
		};
	};

};

export default new Dataview();
