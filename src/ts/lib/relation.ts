import { I, UtilCommon, UtilFile, translate, Dataview } from 'Lib';
import { dbStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

class Relation {

	public typeName (v: I.RelationType): string {
		return UtilCommon.toCamelCase(I.RelationType[v || I.RelationType.LongText]);
	};

	public className (v: I.RelationType): string {
		let c = this.typeName(v);
		if ([ I.RelationType.Status, I.RelationType.Tag ].indexOf(v) >= 0) {
			c = 'select ' + this.selectClassName(v);
		};
		return 'c-' + c;
	};

	public selectClassName (v: I.RelationType): string {
		return UtilCommon.toCamelCase('is-' + I.RelationType[v]);
	};

	public cellId (prefix: string, relationKey: string, id: string|number) {
		return [ prefix, relationKey, id ].join('-');
	};

	public width (width: number, format: I.RelationType): number {
		const size = Constant.size.dataview.cell;
		return Number(width || size['format' + format]) || size.default;
	};

	public filterConditionsByType (type: I.RelationType): { id: I.FilterCondition, name: string}[] {
		let ret = [
			{ id: I.FilterCondition.None,		 name: translate('filterConditionNone') }, 
		];

		switch (type) {
			case I.RelationType.ShortText: 
			case I.RelationType.LongText: 
			case I.RelationType.Url: 
			case I.RelationType.Email: 
			case I.RelationType.Phone: 
				ret = ret.concat([ 
					{ id: I.FilterCondition.Equal,		 name: translate('filterConditionEqual') }, 
					{ id: I.FilterCondition.NotEqual,	 name: translate('filterConditionNotEqual') }, 
					{ id: I.FilterCondition.Like,		 name: translate('filterConditionLike') }, 
					{ id: I.FilterCondition.NotLike,	 name: translate('filterConditionNotLike') },
					{ id: I.FilterCondition.Empty,		 name: translate('filterConditionEmpty') }, 
					{ id: I.FilterCondition.NotEmpty,	 name: translate('filterConditionNotEmpty') },
				]);
				break;

			case I.RelationType.Object: 
			case I.RelationType.Status: 
			case I.RelationType.Tag: 
				ret = ret.concat([ 
					{ id: I.FilterCondition.In,			 name: translate('filterConditionInArray') }, 
					{ id: I.FilterCondition.AllIn,		 name: translate('filterConditionAllIn') }, 
					{ id: I.FilterCondition.NotIn,		 name: translate('filterConditionNotInArray') },
					{ id: I.FilterCondition.Empty,		 name: translate('filterConditionEmpty') }, 
					{ id: I.FilterCondition.NotEmpty,	 name: translate('filterConditionNotEmpty') },
				]);
				break;
			
			case I.RelationType.Number:
				ret = ret.concat([ 
					{ id: I.FilterCondition.Equal,			 name: '=' }, 
					{ id: I.FilterCondition.NotEqual,		 name: '≠' }, 
					{ id: I.FilterCondition.Greater,		 name: '>' }, 
					{ id: I.FilterCondition.Less,			 name: '<' }, 
					{ id: I.FilterCondition.GreaterOrEqual,	 name: '≥' }, 
					{ id: I.FilterCondition.LessOrEqual,	 name: '≤' },
					{ id: I.FilterCondition.Empty,		 name: translate('filterConditionEmpty') }, 
					{ id: I.FilterCondition.NotEmpty,	 name: translate('filterConditionNotEmpty') },
				]);
				break;

			case I.RelationType.Date:
				ret = ret.concat([ 
					{ id: I.FilterCondition.Equal,			 name: translate('filterConditionEqual') }, 
					{ id: I.FilterCondition.Greater,		 name: translate('filterConditionGreaterDate') }, 
					{ id: I.FilterCondition.Less,			 name: translate('filterConditionLessDate') }, 
					{ id: I.FilterCondition.GreaterOrEqual,	 name: translate('filterConditionGreaterOrEqualDate') }, 
					{ id: I.FilterCondition.LessOrEqual,	 name: translate('filterConditionLessOrEqualDate') },
					{ id: I.FilterCondition.In,				 name: translate('filterConditionInDate') },
					{ id: I.FilterCondition.Empty,			 name: translate('filterConditionEmpty') }, 
					{ id: I.FilterCondition.NotEmpty,		 name: translate('filterConditionNotEmpty') },
				]);
				break;
			
			case I.RelationType.Checkbox:
			default:
				ret = ret.concat([ 
					{ id: I.FilterCondition.Equal,			 name: translate('filterConditionEqual') }, 
					{ id: I.FilterCondition.NotEqual,		 name: translate('filterConditionNotEqual') },
				]);
				break;
		};
		return ret;
	};

	public filterQuickOptions (type: I.RelationType, condition: I.FilterCondition) {
		if ([ I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(condition)) {
			return [];
		};

		let ret = [];

		switch (type) {
			case I.RelationType.Date: {
				const defaultOptions = [
					I.FilterQuickOption.NumberOfDaysAgo,
					I.FilterQuickOption.NumberOfDaysNow,
					I.FilterQuickOption.ExactDate,
				];

				const extendedOptions = [
					I.FilterQuickOption.Today,
					I.FilterQuickOption.Tomorrow,
					I.FilterQuickOption.Yesterday,
					I.FilterQuickOption.LastWeek,
					I.FilterQuickOption.CurrentWeek,
					I.FilterQuickOption.NextWeek,
					I.FilterQuickOption.LastMonth,
					I.FilterQuickOption.CurrentMonth,
					I.FilterQuickOption.NextMonth,
				];

				switch (condition) {
					case I.FilterCondition.Equal: {
						ret = ret.concat([
							I.FilterQuickOption.Today,
							I.FilterQuickOption.Tomorrow,
							I.FilterQuickOption.Yesterday,
						]);
						ret = ret.concat(defaultOptions);
						break;
					};

					case I.FilterCondition.Greater:
					case I.FilterCondition.Less:
					case I.FilterCondition.GreaterOrEqual:
					case I.FilterCondition.LessOrEqual: {
						ret = ret.concat(extendedOptions).concat(defaultOptions);
						break;
					};

					case I.FilterCondition.In: {
						ret = ret.concat(extendedOptions);
						break;
					};

					case I.FilterCondition.None: {
						break;
					};

					default: {
						ret = ret.concat(defaultOptions);
						break;
					};
				};
				break;
			};
		};

		return ret.map(id => ({ id, name: translate(`quickOption${id}`) }));
	};

	public formatValue (relation: any, value: any, maxCount: boolean) {
		switch (relation.format) {
			default: {
				value = String(value || '');
				break;
			};

			case I.RelationType.Number: {
				value = String(value || '').replace(/,\s?/g, '.').replace(/[^\d\.e+-]*/gi, '');
				if ((value === '') || (value === undefined)) {
					value = null;
				};
				if (value !== null) {
					value = Number(value);
				};
				if (isNaN(value)) {
					value = null;
				};
				break;
			};

			case I.RelationType.Date: {
				if ((value === '') || (value === undefined)) {
					value = null;
				};
				if (value !== null) {
					value = parseFloat(String(value || '0'));
				};
				break;
			};

			case I.RelationType.Checkbox: {
				value = Boolean(value);
				break;
			};

			case I.RelationType.Status:
			case I.RelationType.File:
			case I.RelationType.Tag:
			case I.RelationType.Object:
			case I.RelationType.Relations: {
				value = this.getArrayValue(UtilCommon.objectCopy(value));

				if (maxCount && relation.maxCount) {
					value = value.slice(value.length - relation.maxCount, value.length);
				};
				break;
			};
		};
		return value;
	};

	public checkRelationValue (relation: any, value: any): boolean {
		value = this.formatValue(relation, value, false);

		let ret = false;
		switch (relation.format) {
			default: {
				ret = value ? true : false;
				break;
			};

			case I.RelationType.Checkbox: {
				ret = true;
				break;
			};

			case I.RelationType.Status:
			case I.RelationType.File:
			case I.RelationType.Tag:
			case I.RelationType.Object:
			case I.RelationType.Relations: {
				ret = value.length ? true : false;
				break;
			};
		};
		return ret;
	};

	public mapValue (relation: any, value: any) {
		switch (relation.relationKey) {
			case 'sizeInBytes': {
				return UtilFile.size(value);
			};

			case 'widthInPixels':
			case 'heightInPixels': {
				return UtilCommon.formatNumber(value) + 'px';
			};

			case 'layout': {
				value = Number(value) || I.ObjectLayout.Page;
				return I.ObjectLayout[value];
			};
		};
		return null;
	};

	public getOptions (value: any[]) {
		return this.getArrayValue(value).map(id => dbStore.getOption(id)).filter(it => it && !it._empty_);
	};

	public getFilterOptions (rootId: string, blockId: string, view: I.View) {
		const formats = [ I.RelationType.File ];
		const ret: any[] = [];
		const relations: any[] = Dataview.viewGetRelations(rootId, blockId, view).filter((it: I.ViewRelation) => { 
			const relation = dbStore.getRelationByKey(it.relationKey);
			return relation && !formats.includes(relation.format) && (it.relationKey != 'done');
		});
		const idxName = relations.findIndex(it => it.relationKey == 'name');

		relations.splice((idxName >= 0 ? idxName + 1 : 0), 0, { relationKey: 'done' });

		relations.forEach((it: I.ViewRelation) => {
			const relation: any = dbStore.getRelationByKey(it.relationKey);
			if (!relation) {
				return;
			};

			ret.push({ 
				id: relation.relationKey, 
				icon: 'relation ' + this.className(relation.format),
				name: relation.name, 
				isHidden: relation.isHidden,
				format: relation.format,
				maxCount: relation.maxCount,
			});
		});
		return ret;
	};

	public getSizeOptions () {
		return [
			{ id: I.CardSize.Small, name: translate('libRelationSmall') },
			{ id: I.CardSize.Medium, name: translate('libRelationMedium') },
			{ id: I.CardSize.Large, name: translate('libRelationLarge') },
		];
	};

	public getCoverOptions (rootId: string, blockId: string) {
		const formats = [ I.RelationType.File ];
		const options: any[] = UtilCommon.objectCopy(dbStore.getObjectRelations(rootId, blockId)).filter((it: any) => {
			return it.isInstalled && !it.isHidden && formats.includes(it.format);
		}).map(it => ({
			id: it.relationKey, 
			icon: 'relation ' + this.className(it.format),
			name: it.name, 
		}));

		return [
			{ id: '', icon: '', name: translate('libRelationNone') },
			{ id: Constant.pageCoverRelationKey, icon: 'image', name: translate('libRelationPageCover') },
		].concat(options);
	};

	public getGroupOptions (rootId: string, blockId: string) {
		const formats = [ I.RelationType.Status, I.RelationType.Tag, I.RelationType.Checkbox ];
		
		let options: any[] = dbStore.getObjectRelations(rootId, blockId).filter((it: any) => {
			return it.isInstalled && formats.includes(it.format) && (!it.isHidden || [ 'done' ].includes(it.relationKey));
		});

		options.sort((c1: any, c2: any) => {
			const f1 = c1.format;
			const f2 = c2.format;

			if ((f1 == I.RelationType.Status) && (f2 != I.RelationType.Status)) return -1;
			if ((f1 != I.RelationType.Status) && (f2 == I.RelationType.Status)) return 1;

			if ((f1 == I.RelationType.Tag) && (f2 != I.RelationType.Tag)) return -1;
			if ((f1 != I.RelationType.Tag) && (f2 == I.RelationType.Tag)) return 1;

			if ((f1 == I.RelationType.Checkbox) && (f2 != I.RelationType.Checkbox)) return -1;
			if ((f1 != I.RelationType.Checkbox) && (f2 == I.RelationType.Checkbox)) return 1;
			return 0;
		});

		options = options.map(it => ({
			id: it.relationKey, 
			icon: 'relation ' + this.className(it.format),
			name: it.name, 
		}));

		return options;
	};

	public getGroupOption (rootId: string, blockId: string, relationKey: string) {
		const groupOptions = this.getGroupOptions(rootId, blockId);
		return groupOptions.length ? (groupOptions.find(it => it.id == relationKey) || groupOptions[0]) : null;
	};

	public getPageLimitOptions (type: I.ViewType) {
		let options = [ 10, 20, 50, 70, 100 ];
		if (type == I.ViewType.Gallery) {
			options = [ 12, 24, 60, 84, 120 ];
		};
		return options.map(it => ({ id: it, name: it }));
	};

	public getStringValue (value: any) {
		if ((typeof value === 'object') && value && UtilCommon.hasProperty(value, 'length')) {
			return String(value.length ? value[0] : '');
		} else {
			return String(value || '');
		};
	};

	public getArrayValue (value: any): string[] {
		if (this.isEmpty(value)) {
			return [];
		};
		if (typeof value !== 'object') {
			return [ value ];
		};
		if (!UtilCommon.objectLength(value)) {
			return [];
		};
		return UtilCommon.arrayUnique(value.map(it => String(it || '')).filter(it => !this.isEmpty(it)));
	};

	private isEmpty (v: any) {
		return (v === null) || (v === undefined) || (v === '');
	};

	public isUrl (type: I.RelationType) {
		return [ I.RelationType.Url, I.RelationType.Email, I.RelationType.Phone ].includes(type);
	};

	public getUrlScheme (type: I.RelationType, value: string): string {
		value = String(value || '');

		let ret = '';
		if (type == I.RelationType.Url && !value.match(/:\/\//)) {
			ret = 'http://';
		};
		if (type == I.RelationType.Email) {
			ret = 'mailto:';
		};
		if (type == I.RelationType.Phone) {
			ret = 'tel:';
		};
		return ret;
	};

	public getSetOfObjects (rootId: string, objectId: string, type: string) {
		const object = detailStore.get(rootId, objectId, [ 'setOf' ]);
		const setOf = this.getArrayValue(object.setOf);
		const ret = [];

		setOf.forEach((id: string) => {
			let el = null;

			switch (type) {
				case Constant.typeId.type:
					el = dbStore.getType(id);
					break;

				case Constant.typeId.relation:
					el = dbStore.getRelationById(id);
					break;
			};

			if (el) {
				ret.push(el);
			};
		});

		return ret;
	};

	public getTimestampForQuickOption (value: any, option: I.FilterQuickOption) {
		const time = UtilCommon.time();

		switch (option) {
			case I.FilterQuickOption.Yesterday: {
				value = time - 86400;
				break;
			};

			case I.FilterQuickOption.CurrentWeek:
			case I.FilterQuickOption.CurrentMonth:
			case I.FilterQuickOption.Today: {
				value = time;
				break;
			};

			case I.FilterQuickOption.Tomorrow: {
				value = time + 86400;
				break;
			};

			case I.FilterQuickOption.LastWeek: {
				value = time - 86400 * 7;
				break;
			};

			case I.FilterQuickOption.LastMonth: {
				value = time - 86400 * 30;
				break;
			};

			case I.FilterQuickOption.NextWeek: {
				value = time + 86400 * 7;
				break;
			};

			case I.FilterQuickOption.NextMonth: {
				value = time + 86400 * 30;
				break;
			};

			case I.FilterQuickOption.NumberOfDaysAgo: {
				value = time - 86400 * value;
				break;
			};

			case I.FilterQuickOption.NumberOfDaysNow: {
				value = time + 86400 * value;
				break;
			};
		};

		return value;
	};

	systemKeys () {
		return require('lib/json/generated/systemRelations.json');
	};
	
};

export default new Relation();
