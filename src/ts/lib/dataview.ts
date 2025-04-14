import arrayMove from 'array-move';
import { I, M, C, S, U, J, Relation, translate } from 'Lib';

class Dataview {

	viewGetRelations (rootId: string, blockId: string, view: I.View): I.ViewRelation[] {
		if (!view) {
			return [];
		};

		const { config } = S.Common;
		const order: any = {};
		const viewRelations = (view.relations || []).filter(it => it);

		let relations = S.Record.getDataviewRelations(rootId, blockId);
		relations = U.Common.objectCopy(relations).filter(it => it);

		if (!config.debug.hiddenObject) {
			relations = relations.filter(it => (it.relationKey == 'name') || !it.isHidden);
		};

		let o = 0;
		viewRelations.forEach(it => order[it.relationKey] = o++);

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

		const ret = relations.map(relation => {
			const vr = viewRelations.find(it => it.relationKey == relation.relationKey) || {};

			if ((view.type != I.ViewType.Gallery) && (relation.relationKey == 'name')) {
				vr.isVisible = true;
			};

			return new M.ViewRelation({
				...vr,
				relationKey: relation.relationKey,
				width: Relation.width(vr.width, relation.format),
			});
		});

		return U.Common.arrayUniqueObjects(ret, 'relationKey');
	};

	relationAdd (rootId: string, blockId: string, relationKey: string, index: number, view: I.View, callBack?: (message: any) => void) {
		C.BlockDataviewRelationAdd(rootId, blockId, [ relationKey ], (message: any) => {
			if (!message.error.code) {
				this.viewRelationAdd(rootId, blockId, relationKey, index, view, callBack);
			};
		});
	};

	viewRelationAdd (rootId: string, blockId: string, relationKey: string, index: number, view?: I.View, callBack?: (message: any) => void) {
		if (!view) {
			return;
		};

		const rel: any = view.getRelation(relationKey) || {};

		rel.relationKey = relationKey;
		rel.width = rel.width || J.Size.dataview.cell.default;
		rel.isVisible = true;

		C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, relationKey, rel, (message: any) => {
			if (index >= 0) {
				const newView = S.Record.getView(rootId, blockId, view.id);
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
	};

	getData (param: any, callBack?: (message: any) => void) {
		param = Object.assign({
			rootId: '',
			blockId: '',
			subId: '',
			newViewId: '',
			keys: J.Relation.default,
			offset: 0,
			limit: 0,
			sources: [],
			clear: false,
			collectionId: '',
			filters: [],
			sorts: [],
		}, param);

		const { rootId, blockId, newViewId, keys, offset, limit, clear, collectionId } = param;
		const block = S.Block.getLeaf(rootId, blockId);
		const view = S.Record.getView(rootId, blockId, newViewId);
		
		if (!view) {
			return;
		};

		const subId = param.subId || S.Record.getSubId(rootId, blockId);
		const { viewId } = S.Record.getMeta(subId, '');
		const viewChange = newViewId != viewId;
		const meta: any = { offset };
		const filters = U.Common.objectCopy(view.filters).concat(param.filters || []);
		const sorts = U.Common.objectCopy(view.sorts).concat(param.sorts || []);

		filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() });

		if (viewChange) {
			meta.viewId = newViewId;
		};
		if (viewChange || clear) {
			S.Record.recordsSet(subId, '', []);
		};

		S.Record.metaSet(subId, '', meta);

		if (block) {
			const el = block.content.objectOrder.find(it => (it.viewId == view.id) && (it.groupId == ''));
			const objectIds = el ? el.objectIds || [] : [];

			if (objectIds.length) {
				sorts.unshift({ relationKey: '', type: I.SortType.Custom, customOrder: objectIds });
			};
		};

		U.Data.searchSubscribe({
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
		const relation = S.Record.getRelationByKey(it.relationKey);
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
		let view = null;

		if (!viewId) {
			viewId = S.Record.getMeta(S.Record.getSubId(rootId, blockId), '').viewId;
		};

		if (viewId) {
			view = S.Record.getView(rootId, blockId, viewId);
		};

		if (!view) {
			const views = S.Record.getViews(rootId, blockId);
			if (views.length) {
				view = views[0];
			};
		};

		return view;
	};

	isCollection (rootId: string, blockId: string): boolean {
		const object = S.Detail.get(rootId, rootId, [ 'layout' ], true);
		const isInline = !U.Object.isInSystemLayouts(object.layout);

		if (!isInline) {
			return U.Object.isCollectionLayout(object.layout);
		};

		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return false;
		};

		const { targetObjectId, isCollection } = block.content;
		const target = targetObjectId ? S.Detail.get(rootId, targetObjectId, [ 'layout' ], true) : null;

		return target ? U.Object.isCollectionLayout(target.layout) : isCollection;
	};

	loadGroupList (rootId: string, blockId: string, viewId: string, object: any) {
		const view = this.getView(rootId, blockId, viewId);
		const block = S.Block.getLeaf(rootId, blockId);

		if (!view || !block) {
			return;
		};

		const subId = S.Record.getGroupSubId(rootId, block.id, 'groups');
		const isCollection = U.Object.isCollectionLayout(object.layout);

		S.Record.groupsClear(rootId, block.id);

		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return;
		};

		const groupOrder: any = {};
		const el = block.content.groupOrder.find(it => it.viewId == view.id);

		if (el) {
			el.groups.forEach(it => groupOrder[it.groupId] = it);
		};

		C.ObjectGroupsSubscribe(S.Common.space, subId, view.groupRelationKey, view.filters, object.setOf || [], isCollection ? object.id : '', (message: any) => {
			if (message.error.code) {
				return;
			};

			const groups = (message.groups || []).map((it: any) => {
				let bgColor = 'grey';
				let value: any = it.value;
				let option: any = null;

				switch (relation.format) {
					case I.RelationType.MultiSelect:
						value = Relation.getArrayValue(value);
						if (value.length) {
							option = S.Detail.get(J.Constant.subId.option, value[0]);
							bgColor = option?.color;
						};
						break;

					case I.RelationType.Select:
						option = S.Detail.get(J.Constant.subId.option, value);
						bgColor = option?.color;
						break;
				};

				it.isHidden = groupOrder[it.id]?.isHidden;
				it.bgColor = groupOrder[it.id]?.bgColor || bgColor;
				return it;
			});

			S.Record.groupsSet(rootId, block.id, this.applyGroupOrder(rootId, block.id, view.id, groups));
		});
	};

	getGroupFilter (relation: any, value: any): I.Filter {
		const filter: any = { relationKey: relation.relationKey };

		switch (relation.format) {
			default: {
				filter.condition = I.FilterCondition.Equal;
				filter.value = value;
				break;
			};

			case I.RelationType.Select: {
				filter.condition = value ? I.FilterCondition.Equal : I.FilterCondition.Empty;
				filter.value = value ? value : null;
				break;
			};

			case I.RelationType.MultiSelect: {
				value = Relation.getArrayValue(value);
				filter.condition = value.length ? I.FilterCondition.ExactIn : I.FilterCondition.Empty;
				filter.value = value.length ? value : null;
				break;
			};
		};
		return filter;
	};

	getGroups (rootId: string, blockId: string, viewId: string, withHidden: boolean) {
		const groups = U.Common.objectCopy(S.Record.getGroups(rootId, blockId));
		const ret = this.applyGroupOrder(rootId, blockId, viewId, groups);

		return !withHidden ? ret.filter(it => !it.isHidden) : ret;
	};

	groupUpdate (rootId: string, blockId: string, viewId: string, groups: any[]) {
		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const el = block.content.groupOrder.find(it => it.viewId == viewId);
		if (el) {
			el.groups = groups;
		};

		S.Block.updateContent(rootId, blockId, block.content);
	};

	groupOrderUpdate (rootId: string, blockId: string, viewId: string, groups: any[]) {
		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const groupOrder = U.Common.objectCopy(block.content.groupOrder);
		const idx = groupOrder.findIndex(it => it.viewId == viewId);

		if (idx >= 0) {
			groupOrder[idx].groups = groups;
		} else {
			groupOrder.push({ viewId, groups });
		};

		S.Block.updateContent(rootId, blockId, { groupOrder });
	};

	applyGroupOrder (rootId: string, blockId: string, viewId: string, groups: any[]) {
		if (!viewId || !groups.length) {
			return groups;
		};

		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return groups;
		};

		const el = block.content.groupOrder.find(it => it.viewId == viewId);
		const groupOrder: any = {};

		if (el) {
			el.groups.forEach(it => groupOrder[it.groupId] = it);
		};

		groups.sort((c1: any, c2: any) => {
			const idx1 = groupOrder[c1.id]?.index;
			const idx2 = groupOrder[c2.id]?.index;
			if (idx1 > idx2) return 1;
			if (idx1 < idx2) return -1;
			return 0;
		});

		return groups;
	};

	applyObjectOrder (rootId: string, blockId: string, viewId: string, groupId: string, records: string[]): string[] {
		records = records || [];

		if (!viewId || !records.length) {
			return records;
		};

		const block = S.Block.getLeaf(rootId, blockId);
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

		if (relations.length) {
			relations.forEach(it => {
				details[it.relationKey] = Relation.formatValue(it, details[it.relationKey] || null, true);
			});
		};

		if (!view) {
			return details;
		};

		if (view.groupRelationKey && ('undefined' == typeof(details[view.groupRelationKey]))) {
			if (groupId) {
				const group = S.Record.getGroup(rootId, blockId, groupId);
				if (group) {
					details[view.groupRelationKey] = group.value;
				};
			};

			if (view.type == I.ViewType.Calendar) {
				details[view.groupRelationKey] = U.Date.now();
			};
		};

		for (const filter of view.filters) {
			if (!conditions.includes(filter.condition)) {
				continue;
			};

			const value = Relation.getTimestampForQuickOption(filter.value, filter.quickOption);
			if (!value) {
				continue;
			};

			const relation = S.Record.getRelationByKey(filter.relationKey);
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
		const isAllowedDefaultType = this.isCollection(rootId, blockId) || !!relations.length;

		let typeId = '';

		if (view && view.defaultTypeId && isAllowedDefaultType) {
			typeId = view.defaultTypeId;
		} else
		if (types.length) {
			typeId = types[0].id;
		} else
		if (relations.length) {
			for (const item of relations) {
				const objectTypes = Relation.getArrayValue(item.objectTypes);

				if (!objectTypes.length) {
					continue;
				};

				const first = S.Record.getTypeById(objectTypes[0]);
				if (first && !U.Object.isInFileOrSystemLayouts(first.recommendedLayout)) {
					typeId = first.id;
					break;
				};
			};
		};

		const type = S.Record.getTypeById(typeId);

		if (!type) {
			typeId = S.Common.type;
		};

		return typeId;
	};

	getCreateTooltip (rootId: string, blockId: string, objectId: string, viewId: string): string {
		const isCollection = this.isCollection(rootId, blockId);

		if (isCollection) {
			return translate('blockDataviewCreateNewTooltipCollection');
		} else {
			const typeId = this.getTypeId(rootId, blockId, objectId, viewId);
			const type = S.Record.getTypeById(typeId);

			if (type) {
				return U.Common.sprintf(translate('blockDataviewCreateNewTooltipType'), type.name);
			};
		};
		return translate('commonCreateNewObject');
	};

	viewUpdate (rootId: string, blockId: string, viewId: string, param: Partial<I.View>, callBack?: (message: any) => void) {
		const view = U.Common.objectCopy(S.Record.getView(rootId, blockId, viewId));
		if (view && view.id) {
			C.BlockDataviewViewUpdate(rootId, blockId, view.id, Object.assign(view, param), callBack);
		};
	};

	getCoverObject (subId: string, object: any, relationKey: string): any {
		if (!relationKey) {
			return null;
		};

		const value = Relation.getArrayValue(object[relationKey]);
		const layouts = [
			I.ObjectLayout.Image,
			I.ObjectLayout.Audio,
			I.ObjectLayout.Video,
		];

		let ret = null;
		if (relationKey == J.Relation.pageCover) {
			ret = object;
		} else {
			for (const id of value) {
				const file = S.Detail.get(subId, id, []);
				if (file._empty_ || !layouts.includes(file.layout)) {
					continue;
				};

				ret = file;
				break;
			};
		};

		if (!ret || ret._empty_) {
			return null;
		};

		if (!ret.coverId && !ret.coverType && !layouts.includes(ret.layout)) {
			return null;
		};

		return ret;
	};

	getFormulaResult (subId: string, viewRelation: I.ViewRelation): any {
		if (!viewRelation) {
			return null;
		};

		const { showRelativeDates } = S.Common;
		const { formulaType, includeTime, relationKey } = viewRelation;
		const relation = S.Record.getRelationByKey(relationKey);

		if (!relation) {
			return null;
		};

		const { total } = S.Record.getMeta(subId, '');
		const isDate = relation.format == I.RelationType.Date;
		const isArray = Relation.isArrayType(relation.format);
		const needRecords = ![ I.FormulaType.None, I.FormulaType.Count ].includes(formulaType);
		const records = needRecords ? S.Record.getRecords(subId, [ relationKey ], true) : [];

		const date = (t: number) => {
			const day = showRelativeDates ? U.Date.dayString(t) : null;
			const date = day ? day : U.Date.dateWithFormat(S.Common.dateFormat, t);
			const time = U.Date.timeWithFormat(S.Common.timeFormat, t);

			return includeTime ? [ date, time ].join(' ') : date;
		};

		const min = () => {
			const map = records.map(it => it[relationKey]).filter(it => !Relation.isEmpty(it));
			return map.length ? Math.min(...map.map(it => Number(it || 0))) : null;
		};
		const max = () => {
			const map = records.map(it => it[relationKey]).filter(it => !Relation.isEmpty(it));
			return map.length ? Math.max(...map.map(it => Number(it || 0))) : null;
		};
		const float = (v: any): string => {
			return (v === null) ? null : U.Common.formatNumber(U.Common.round(v, 3));
		};
		const filtered = (filterEmpty: boolean) => {
			return records.filter(it => {
				let isEmpty = false;
				if (relationKey == 'name') {
					isEmpty = Relation.isEmpty(it[relationKey]) || (it[relationKey] == translate('defaultNamePage'));
				} else {
					isEmpty = relation.format == I.RelationType.Checkbox ? !it[relationKey] : Relation.isEmpty(it[relationKey]);
				};
				return filterEmpty == isEmpty;
			});
		};

		let ret = null;

		switch (formulaType) {
			case I.FormulaType.None: {
				break;
			};

			case I.FormulaType.Count: {
				ret = float(total);
				break;
			};

			case I.FormulaType.CountValue: {
				const items = filtered(false);

				if (isArray || isDate) {
					const values = new Set();

					items.forEach(it => {
						values.add(isDate ? 
							date(it[relationKey]) : 
							Relation.getArrayValue(it[relationKey]).sort().join(', ')
						);
					});

					ret = values.size;
				} else {
					ret = U.Common.arrayUniqueObjects(items, relationKey).length;
				};
				ret = float(ret);
				break;
			};

			case I.FormulaType.CountDistinct: {
				const items = filtered(false);

				if (isArray || isDate) {
					const values = new Set();

					items.forEach(it => {
						if (isDate) {
							values.add(date(it[relationKey]));
						} else {
							Relation.getArrayValue(it[relationKey]).forEach(v => values.add(v));
						};
					});

					ret = values.size;
				} else {
					ret = U.Common.arrayUniqueObjects(items, relationKey).length;
				};
				ret = float(ret);
				break;
			};

			case I.FormulaType.CountEmpty: {
				ret = float(filtered(true).length);
				break;
			};

			case I.FormulaType.CountNotEmpty: {
				ret = float(filtered(false).length);
				break;
			};

			case I.FormulaType.PercentEmpty: {
				ret = float(filtered(true).length / total * 100) + '%';
				break;
			};

			case I.FormulaType.PercentNotEmpty: {
				ret = float(filtered(false).length / total * 100) + '%';
				break;
			};

			case I.FormulaType.MathSum: {
				ret = float(records.reduce((acc, it) => acc + (Number(it[relationKey]) || 0), 0));
				break;
			};

			case I.FormulaType.MathAverage: {
				ret = float(records.reduce((acc, it) => acc + (Number(it[relationKey]) || 0), 0) / total);
				break;
			};

			case I.FormulaType.MathMedian: {
				const data = records.map(it => Number(it[relationKey]) || 0);
				const n = data.length;

				data.sort((a, b) => a - b);
    
				if (n % 2 == 1) {
					ret = data[Math.floor(n / 2)];
				} else {
					ret = (data[n / 2 - 1] + data[n / 2]) / 2;
				};

				ret = float(ret);
				break;
			};

			case I.FormulaType.MathMin: {
				ret = min();
				if (isDate) {
					ret = ret ? date(ret) : '';
				} else {
					ret = float(ret);
				};
				break;
			};

			case I.FormulaType.MathMax: {
				ret = max();
				if (isDate) {
					ret = ret ? date(ret) : '';
				} else {
					ret = float(ret);
				};
				break;
			};

			case I.FormulaType.Range: {
				if (isDate) {
					ret = U.Date.duration(max() - min());
				} else {
					ret = float(max() - min());
				};
				break;
			};
		};

		return ret;
	};

	namePlaceholder (layout: I.ObjectLayout): string {
		let ret = '';
		if (U.Object.isCollectionLayout(layout)) {
			ret = translate('defaultNameCollection');
		} else 
		if (U.Object.isTypeLayout(layout)) {
			ret = translate('defaultNameType');
		} else 
		if (U.Object.isSetLayout(layout)) {
			ret = translate('defaultNameSet');
		};
		return ret;
	};

	addTypeOrDataviewRelation (rootId: string, blockId: string, relation: any, object: any, view: I.View, index: number, callBack?: (message: any) => void) {
		if (!rootId || !blockId || !relation || !object || !view) {
			return;
		};

		const isType = U.Object.isTypeLayout(object.layout);

		if (isType) {
			const value = U.Common.arrayUnique(Relation.getArrayValue(object.recommendedRelations).concat(relation.id));

			C.ObjectListSetDetails([ object.id ], [ { key: 'recommendedRelations', value } ], (message: any) => {
				if (message.error.code) {
					return;
				};

				S.Detail.update(J.Constant.subId.type, { id: rootId, details: { recommendedRelations: value } }, false);
				C.BlockDataviewRelationSet(rootId, J.Constant.blockId.dataview, [ 'name', 'description' ].concat(U.Object.getTypeRelationKeys(rootId)), () => {
					this.viewRelationAdd(rootId, blockId, relation.relationKey, index, view, callBack);
				});
			});
		} else {
			this.relationAdd(rootId, blockId, relation.relationKey, index, view, callBack);
		};
	};

};

export default new Dataview();