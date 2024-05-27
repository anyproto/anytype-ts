import { I, UtilCommon, UtilFile, UtilDate, translate, Dataview, UtilObject, UtilMenu } from 'Lib';
import { dbStore, detailStore } from 'Store';
const Constant = require('json/constant.json');

const DICTIONARY = [ 'layout', 'origin', 'importType' ];
const SKIP_SYSTEM_KEYS = [ 'tag', 'description' ];

class Relation {

	public typeName (v: I.RelationType): string {
		return UtilCommon.toCamelCase(I.RelationType[v || I.RelationType.LongText]);
	};

	public className (v: I.RelationType): string {
		let c = '';
		if ([ I.RelationType.Select, I.RelationType.MultiSelect ].includes(v)) {
			c = `select ${this.selectClassName(v)}`;
		} else {
			c = this.typeName(v);
		};
		return `c-${c}`;
	};

	public selectClassName (v: I.RelationType): string {
		return `is${I.RelationType[v]}`;
	};

	public cellId (prefix: string, relationKey: string, id: string|number) {
		return [ prefix, relationKey, id ].join('-');
	};

	public width (width: number, format: I.RelationType): number {
		const size = Constant.size.dataview.cell;
		return Number(width || size[`format${format}`]) || size.default;
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
			case I.RelationType.Phone: {
				ret = ret.concat([ 
					{ id: I.FilterCondition.Equal,		 name: translate('filterConditionEqual') }, 
					{ id: I.FilterCondition.NotEqual,	 name: translate('filterConditionNotEqual') }, 
					{ id: I.FilterCondition.Like,		 name: translate('filterConditionLike') }, 
					{ id: I.FilterCondition.NotLike,	 name: translate('filterConditionNotLike') },
					{ id: I.FilterCondition.Empty,		 name: translate('filterConditionEmpty') }, 
					{ id: I.FilterCondition.NotEmpty,	 name: translate('filterConditionNotEmpty') },
				]);
				break;
			};

			case I.RelationType.File: 
			case I.RelationType.Object: 
			case I.RelationType.Select: 
			case I.RelationType.MultiSelect: {
				ret = ret.concat([ 
					{ id: I.FilterCondition.In,			 name: translate('filterConditionInArray') }, 
					{ id: I.FilterCondition.AllIn,		 name: translate('filterConditionAllIn') }, 
					{ id: I.FilterCondition.NotIn,		 name: translate('filterConditionNotInArray') },
					{ id: I.FilterCondition.Empty,		 name: translate('filterConditionEmpty') }, 
					{ id: I.FilterCondition.NotEmpty,	 name: translate('filterConditionNotEmpty') },
				]);
				break;
			};
			
			case I.RelationType.Number: {
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
			};

			case I.RelationType.Date: {
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
			};
			
			case I.RelationType.Checkbox:
			default: {
				ret = ret.concat([ 
					{ id: I.FilterCondition.Equal,			 name: translate('filterConditionEqual') }, 
					{ id: I.FilterCondition.NotEqual,		 name: translate('filterConditionNotEqual') },
				]);
				break;
			};

		};
		return ret;
	};

	public filterConditionsDictionary () {
		return [ 
			{ id: I.FilterCondition.None,		 name: translate('filterConditionNone') }, 
			{ id: I.FilterCondition.Equal,		 name: translate('filterConditionEqual') }, 
			{ id: I.FilterCondition.NotEqual,	 name: translate('filterConditionNotEqual') }, 
			{ id: I.FilterCondition.Empty,		 name: translate('filterConditionEmpty') }, 
			{ id: I.FilterCondition.NotEmpty,	 name: translate('filterConditionNotEmpty') },
		];
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
				value = this.getStringValue(value);
				break;
			};

			case I.RelationType.Number: {
				value = this.getNumberValue(value);
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

			case I.RelationType.Select:
			case I.RelationType.File:
			case I.RelationType.MultiSelect:
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

			case I.RelationType.Select:
			case I.RelationType.File:
			case I.RelationType.MultiSelect:
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

			case 'origin': {
				value = Number(value) || I.ObjectOrigin.None;
				return (value == I.ObjectOrigin.None) ? null : translate(`origin${value}`);
			};

			case 'importType': {
				const names = UtilMenu.getImportNames();
				return undefined === value ? null : names[Number(value)];
			};

		};
		return null;
	};

	public getOptions (value: any[]) {
		return this.getArrayValue(value).map(id => dbStore.getOption(id)).filter(it => it && !it._empty_);
	};

	public getFilterOptions (rootId: string, blockId: string, view: I.View) {
		const ret: any[] = [];
		const relations: any[] = Dataview.viewGetRelations(rootId, blockId, view).filter((it: I.ViewRelation) => { 
			const relation = dbStore.getRelationByKey(it.relationKey);
			return relation && (it.relationKey != 'done');
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
		const options: any[] = UtilCommon.objectCopy(dbStore.getObjectRelations(rootId, blockId)).filter(it => {
			if (it.isInstalled && (it.relationKey == 'picture')) {
				return true;
			};
			return it.isInstalled && !it.isHidden && formats.includes(it.format);
		}).map(it => ({
			id: it.relationKey, 
			icon: 'relation ' + this.className(it.format),
			name: it.name, 
		}));

		return [
			{ id: '', icon: '', name: translate('commonNone') },
			{ id: Constant.pageCoverRelationKey, icon: 'image', name: translate('libRelationPageCover') },
		].concat(options);
	};

	public getGroupOptions (rootId: string, blockId: string, type: I.ViewType) {
		let formats = [];

		switch (type) {
			default: {
				formats = [ I.RelationType.Select, I.RelationType.MultiSelect, I.RelationType.Checkbox ];
				break;
			};

			case I.ViewType.Calendar: {
				formats = [ I.RelationType.Date ];
				break;
			};
		};
		
		let options: any[] = dbStore.getObjectRelations(rootId, blockId).filter((it: any) => {
			return it.isInstalled && formats.includes(it.format) && (!it.isHidden || [ 'done' ].includes(it.relationKey));
		});

		options.sort((c1: any, c2: any) => {
			const f1 = c1.format;
			const f2 = c2.format;

			if ((f1 == I.RelationType.Select) && (f2 != I.RelationType.Select)) return -1;
			if ((f1 != I.RelationType.Select) && (f2 == I.RelationType.Select)) return 1;

			if ((f1 == I.RelationType.MultiSelect) && (f2 != I.RelationType.MultiSelect)) return -1;
			if ((f1 != I.RelationType.MultiSelect) && (f2 == I.RelationType.MultiSelect)) return 1;

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

	public getGroupOption (rootId: string, blockId: string, type: I.ViewType, relationKey: string) {
		const groupOptions = this.getGroupOptions(rootId, blockId, type);
		return groupOptions.length ? (groupOptions.find(it => it.id == relationKey) || groupOptions[0]) : null;
	};

	public getPageLimitOptions (type: I.ViewType) {
		let options = [ 10, 20, 50, 70, 100 ];
		if (type == I.ViewType.Gallery) {
			options = [ 12, 24, 60, 84, 120 ];
		};
		return options.map(it => ({ id: it, name: it }));
	};

	public getDictionaryOptions (relationKey: string) {
		const names = UtilMenu.getImportNames();
		const dictionary = {
			layout: I.ObjectLayout,
			origin: I.ObjectOrigin,
			importType: I.ImportType,
		};

		const item = dictionary[relationKey];

		if (!item) {
			return [];
		};

		const options = [];
		const keys = Object.keys(item).filter(v => !isNaN(Number(v)));

		keys.forEach((key, index) => {
			let name = '';
			if (relationKey == 'importType') {
				name = names[index];
			} else {
				name = translate(`${relationKey}${index}`);
			};

			if (name) {
				options.push({ id: index, name });
			};
		});

		return options;
	};

	public getNumberValue (value: any): number {
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
		return value;
	};

	public getStringValue (value: any): string {
		if ((typeof value === 'object') && value && UtilCommon.hasProperty(value, 'length')) {
			value = value.length ? value[0] : '';
		};
		return String(value || '');
	};

	public getArrayValue (value: any): any[] {
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

	public isEmpty (v: any) {
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

	public getSetOfObjects (rootId: string, objectId: string, layout: I.ObjectLayout): any[] {
		const object = detailStore.get(rootId, objectId, [ 'setOf' ]);
		const setOf = this.getArrayValue(object.setOf);
		const ret = [];

		setOf.forEach((id: string) => {
			let el = null;

			switch (layout) {
				case I.ObjectLayout.Type: {
					el = dbStore.getTypeById(id);
					break;
				};

				case I.ObjectLayout.Relation: {
					el = dbStore.getRelationById(id);
					break;
				};
			};

			if (el) {
				ret.push(el);
			};
		});

		return ret;
	};

	public getTimestampForQuickOption (value: any, option: I.FilterQuickOption) {
		const time = UtilDate.now();

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

	getParamForNewObject (name: string, relation: any): { flags: I.ObjectFlag[], details: any } {
		const details: any = { name };
		const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate ];
		const objectTypes = this.getArrayValue(relation.objectTypes);

		let type = null;

		if (objectTypes.length) {
			const allowedTypes = objectTypes.map(id => dbStore.getTypeById(id)).filter(it => it && !UtilObject.isFileOrSystemLayout(it.recommendedLayout));
			const l = allowedTypes.length;

			if (l) {
				type = allowedTypes[0];

				if (l > 1) {
					flags.push(I.ObjectFlag.SelectType);
				};
			};
		};

		if (type) {
			details.type = type.id;
		} else {
			flags.push(I.ObjectFlag.SelectType);
		};

		return { flags, details };
	};

	systemKeys () {
		return require('lib/json/generated/systemRelations.json');
	};

	systemKeysWithoutUser () {
		return this.systemKeys().filter(it => !SKIP_SYSTEM_KEYS.includes(it));
	};

	isSystem (relationKey: string): boolean {
		return this.systemKeys().includes(relationKey);
	};

	isSystemWithoutUser (relationKey: string): boolean {
		return this.systemKeysWithoutUser().includes(relationKey);
	};

	isDictionary (relationKey: string): boolean {
		return DICTIONARY.includes(relationKey);
	};
	
};

export default new Relation();