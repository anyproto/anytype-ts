import { I, DataUtil, Util, FileUtil, translate, Dataview } from 'Lib';
import { dbStore, commonStore, detailStore } from 'Store';

const Constant = require('json/constant.json');

class Relation {

	cellId (prefix: string, relationKey: string, id: any) {
		if (undefined === id) {
			id = '';
		};
		return [ prefix, relationKey, id.toString() ].join('-');
	};

	width (width: number, format: I.RelationType): number {
		const size = Constant.size.dataview.cell;
		return Number(width || size['format' + format]) || size.default;
	};

	filterConditionsByType (type: I.RelationType): any[] {
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

	filterQuickOptions (type: I.RelationType, condition: I.FilterCondition) {
		if ([ I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(condition)) {
			return [];
		};

		let ret: any[] = [];

		switch (type) {
			case I.RelationType.Date:
				let defaultOptions: any[] = [
					{ id: I.FilterQuickOption.NumberOfDaysAgo, name: 'Number of days ago' },
					{ id: I.FilterQuickOption.NumberOfDaysNow, name: 'Number of days from now' },
					{ id: I.FilterQuickOption.ExactDate, name: 'Exact date' },
				];

				let extendedOptions: any[] = [
					{ id: I.FilterQuickOption.Today,		 name: 'Today' },
					{ id: I.FilterQuickOption.Tomorrow,		 name: 'Tomorrow' },
					{ id: I.FilterQuickOption.Yesterday,	 name: 'Yesterday' },
					{ id: I.FilterQuickOption.LastWeek,		 name: 'Last week' },
					{ id: I.FilterQuickOption.CurrentWeek,	 name: 'Current week' },
					{ id: I.FilterQuickOption.NextWeek,		 name: 'Next week' },
					{ id: I.FilterQuickOption.LastMonth,	 name: 'Last month' },
					{ id: I.FilterQuickOption.CurrentMonth,	 name: 'Current month' },
					{ id: I.FilterQuickOption.NextMonth,	 name: 'Next month' },
				];

				switch (condition) {
					case I.FilterCondition.Equal:
						ret = ret.concat([
							{ id: I.FilterQuickOption.Today, name: 'Today' },
							{ id: I.FilterQuickOption.Tomorrow, name: 'Tomorrow' },
							{ id: I.FilterQuickOption.Yesterday, name: 'Yesterday' },
						]);
						ret = ret.concat(defaultOptions);
						break;

					case I.FilterCondition.Greater:
					case I.FilterCondition.Less:
					case I.FilterCondition.GreaterOrEqual:
					case I.FilterCondition.LessOrEqual:
						ret = ret.concat(extendedOptions);
						ret = ret.concat(defaultOptions);
						break;

					case I.FilterCondition.In:
						ret = ret.concat(extendedOptions);
						break;

					case I.FilterCondition.None:
						break;

					default: 
						ret = ret.concat(defaultOptions);
						break;
				};
				break;
		};

		return ret;
	};

	formatValue (relation: any, value: any, maxCount: boolean) {
		switch (relation.format) {
			default:
				value = String(value || '');
				break;

			case I.RelationType.Number:
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
			case I.RelationType.Date:
				if ((value === '') || (value === undefined)) {
					value = null;
				};
				if (value !== null) {
					value = parseFloat(String(value || '0'));
				};
				break;

			case I.RelationType.Checkbox:
				value = Boolean(value);
				break;

			case I.RelationType.Status:
			case I.RelationType.File:
			case I.RelationType.Tag:
			case I.RelationType.Object:
			case I.RelationType.Relations:
				if ('object' !== typeof(value)) {
					value = value ? [ value ] : [];
				};

				value = Util.objectCopy(value || []);
				value = Util.arrayUnique(value);
				value = value.map(it => String(it || ''));
				value = value.filter(it => it);

				if (maxCount && relation.maxCount) {
					value = value.slice(value.length - relation.maxCount, value.length);
				};
				break;
		};
		return value;
	};

	checkRelationValue (relation: any, value: any): boolean {
		value = this.formatValue(relation, value, false);

		let ret = false;
		switch (relation.format) {
			default:
				ret = value ? true : false;
				break;

			case I.RelationType.Status:
			case I.RelationType.File:
			case I.RelationType.Tag:
			case I.RelationType.Object:
			case I.RelationType.Relations:
				ret = value.length ? true : false;
				break;
		};
		return ret;
	};

	mapValue (relation: any, value: any) {
		switch (relation.relationKey) {
			case 'sizeInBytes':
				return FileUtil.size(value);

			case 'widthInPixels':
			case 'heightInPixels':
				return Util.formatNumber(value) + 'px';

			case 'layout':
				value = Number(value) || I.ObjectLayout.Page;
				return I.ObjectLayout[value];
		};
		return null;
	};

	getOptions (value: any[]) {
		return this.getArrayValue(value).map(id => dbStore.getOption(id)).filter(it => it && !it._empty_);
	};

	getFilterOptions (rootId: string, blockId: string, view: I.View) {
		let relations: any[] = Dataview.viewGetRelations(rootId, blockId, view).filter((it: I.ViewRelation) => { 
			const relation = dbStore.getRelationByKey(it.relationKey);
			return relation && (relation.format != I.RelationType.File) && (it.relationKey != Constant.relationKey.done);
		});
		let idxName = relations.findIndex((it: any) => { return it.relationKey == Constant.relationKey.name; });

		relations.splice((idxName >= 0 ? idxName + 1 : 0), 0, {
			relationKey: Constant.relationKey.done,
		});

		let ret: any[] = [];
		relations.forEach((it: I.ViewRelation) => {
			const relation: any = dbStore.getRelationByKey(it.relationKey);
			if (!relation) {
				return;
			};

			ret.push({ 
				id: relation.relationKey, 
				icon: 'relation ' + DataUtil.relationClass(relation.format),
				name: relation.name, 
				isHidden: relation.isHidden,
				format: relation.format,
				maxCount: relation.maxCount,
			});
		});
		return ret;
	};

	getSizeOptions () {
		return [
			{ id: I.CardSize.Small, name: 'Small' },
			{ id: I.CardSize.Medium, name: 'Medium' },
			{ id: I.CardSize.Large, name: 'Large' },
		];
	};

	getCoverOptions (rootId: string, blockId: string) {
		const { config } = commonStore;

		const options: any[] = Util.objectCopy(dbStore.getRelations(rootId, blockId)).filter((it: any) => {
			return !it.isHidden && (it.format == I.RelationType.File);
		}).map((it: any) => {
			return { 
				id: it.relationKey, 
				icon: 'relation ' + DataUtil.relationClass(it.format),
				name: it.name, 
			};
		});

		const ret = [
			{ id: '', icon: '', name: 'None' },
			{ id: 'pageCover', icon: 'image', name: 'Page cover' },
		];

		if (config.experimental) {
			ret.push({ id: 'iconImage', icon: 'image', name: 'Image' });
		};

		return ret.concat(options);
	};

	getGroupOptions (rootId: string, blockId: string) {
		const formats = [ I.RelationType.Status, I.RelationType.Tag, I.RelationType.Checkbox ];
		
		let options: any[] = dbStore.getRelations(rootId, blockId);

		options = options.filter((it: any) => {
			return formats.includes(it.format) && (!it.isHidden || [ Constant.relationKey.done ].includes(it.relationKey));
		});

		options.sort((c1: any, c2: any) => {
			if ((c1.format == I.RelationType.Status) && (c2.format != I.RelationType.Status)) return -1;
			if ((c1.format != I.RelationType.Status) && (c2.format == I.RelationType.Status)) return 1;

			if ((c1.format == I.RelationType.Tag) && (c2.format != I.RelationType.Tag)) return -1;
			if ((c1.format != I.RelationType.Tag) && (c2.format == I.RelationType.Tag)) return 1;

			if ((c1.format == I.RelationType.Checkbox) && (c2.format != I.RelationType.Checkbox)) return -1;
			if ((c1.format != I.RelationType.Checkbox) && (c2.format == I.RelationType.Checkbox)) return 1;

			return 0;
		});

		options = options.map((it: any) => {
			return { 
				id: it.relationKey, 
				icon: 'relation ' + DataUtil.relationClass(it.format),
				name: it.name, 
			};
		});

		return options;
	};

	getGroupOption (rootId: string, blockId: string, relationKey: string) {
		const groupOptions = this.getGroupOptions(rootId, blockId);
		return groupOptions.length ? (groupOptions.find(it => it.id == relationKey) || groupOptions[0]) : null;
	};

	getStringValue (value: any) {
		if (('object' == typeof(value)) && value && value.hasOwnProperty('length')) {
			return String(value.length ? value[0] : '');
		} else {
			return String(value || '');
		};
	};

	getArrayValue (value: any): string[] {
		value = Util.objectCopy(value);

		if ('object' != typeof(value)) {
			value = !this.isEmpty(value) ? [ value ] : [];
		} else 
		if (!Util.objectLength(value)) {
			value = [];
		};

		value = value.filter(it => !this.isEmpty(it));
		return Util.arrayUnique(value);
	};

	isEmpty (v: any) {
		return (v === null) || (v === undefined) || (v === '');
	};

	getUrlScheme (type: I.RelationType, value: any): string {
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

	getSetOfObjects (rootId: string, objectId: string, typeId: string) {
		const object = detailStore.get(rootId, objectId, [ 'setOf' ]);
		const setOf = this.getArrayValue(object.setOf);
		const ret = [];

		setOf.forEach((id: string) => {
			let el = dbStore.getType(id);
			if (!el) {
				el = dbStore.getRelationById(id);
			};

			if (el) {
				ret.push(el);
			};
		});

		return ret.filter(it => typeId == it.type);
	};
	
};

export default new Relation();