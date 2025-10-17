import { I, S, U, J, translate, Dataview } from 'Lib';

const DICTIONARY = [ 'layout', 'origin', 'importType' ];
const SKIP_SYSTEM_KEYS = [ 'tag', 'description' ];

class Relation {

	/**
	 * Returns the type name for a relation type.
	 * @param {I.RelationType} v - The relation type.
	 * @returns {string} The type name.
	 */
	public typeName (v: I.RelationType): string {
		return U.Common.toCamelCase(I.RelationType[v || I.RelationType.LongText]);
	};

	/**
	 * Returns the CSS class name for a relation type.
	 * @param {I.RelationType} v - The relation type.
	 * @returns {string} The class name.
	 */
	public className (v: I.RelationType): string {
		v = Number(v);

		let c = '';
		if ([ I.RelationType.Select, I.RelationType.MultiSelect ].includes(v)) {
			c = `select ${this.selectClassName(v)}`;
		} else {
			c = this.typeName(v);
		};
		return `c-${c}`;
	};

	/**
	 * Returns the icon name for a relation key and type.
	 * @param {string} key - The relation key.
	 * @param {I.RelationType} v - The relation type.
	 * @returns {string} The icon name.
	 */
	public iconName (key: string, v: I.RelationType): string {
		return key == 'description' ? 'description' : this.typeName(v);
	};

	/**
	 * Returns the select class name for a relation type.
	 * @param {I.RelationType} v - The relation type.
	 * @returns {string} The select class name.
	 */
	public selectClassName (v: I.RelationType): string {
		return `is${I.RelationType[v]}`;
	};

	/**
	 * Returns a cell ID string for a prefix, relation key, and ID.
	 * @param {string} prefix - The prefix.
	 * @param {string} relationKey - The relation key.
	 * @param {string|number} id - The ID.
	 * @returns {string} The cell ID.
	 */
	public cellId (prefix: string, relationKey: string, id: string|number) {
		return [ prefix, relationKey, id ].join('-');
	};

	/**
	 * Returns the width for a relation cell based on format.
	 * @param {number} width - The width value.
	 * @param {I.RelationType} format - The relation format.
	 * @returns {number} The calculated width.
	 */
	public width (width: number, format: I.RelationType): number {
		const size = J.Size.dataview.cell;
		return Number(width || size[`format${format}`]) || size.default;
	};

	/**
	 * Returns available filter conditions for a relation type.
	 * @param {I.RelationType} type - The relation type.
	 * @returns {Array<{id: I.FilterCondition, name: string}>} The filter conditions.
	 */
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

	/**
	 * Returns available formula options for a relation type.
	 * @param {string} relationKey - The relation key.
	 * @param {I.RelationType} type - The relation type.
	 * @returns {Array<{id: string, name: string, short?: string, section: I.FormulaSection}>} The formula options.
	 */
	public formulaByType (relationKey: string, type: I.RelationType): { id: string, name: string, short?: string, section: I.FormulaSection }[] {
		const relation = S.Record.getRelationByKey(relationKey);
		if (!relation) {
			return [];
		};

		const isArrayType = this.isArrayType(type);
		const skipEmptyKeys = [
			'type', 
			'creator', 
			'createdDate', 
			'addedDate',
		];
		const skipEmpty = [ 
			I.FormulaType.CountEmpty, 
			I.FormulaType.CountNotEmpty,
			I.FormulaType.PercentEmpty,
			I.FormulaType.PercentNotEmpty,
		];
		const skipUnique = [
			I.FormulaType.CountValue,
		];

		const common = [
			{ id: I.FormulaType.Count, name: translate('formulaCount'), section: I.FormulaSection.Count },
			{ id: I.FormulaType.CountValue, name: translate('formulaValue'), short: translate('formulaValueShort'), section: I.FormulaSection.Count },
			{ id: I.FormulaType.CountDistinct, name: translate('formulaDistinct'), short: translate('formulaDistinctShort'), section: I.FormulaSection.Count },
			{ id: I.FormulaType.CountEmpty, name: translate('formulaEmpty'), short: translate('formulaEmptyShort'), section: I.FormulaSection.Count },
			{ id: I.FormulaType.CountNotEmpty, name: translate('formulaNotEmpty'), short: translate('formulaNotEmptyShort'), section: I.FormulaSection.Count },
			{ id: I.FormulaType.PercentEmpty, name: translate('formulaPercentEmpty'), short: translate('formulaEmptyShort'), section: I.FormulaSection.Percent },
			{ id: I.FormulaType.PercentNotEmpty, name: translate('formulaPercentNotEmpty'), short: translate('formulaNotEmptyShort'), section: I.FormulaSection.Percent },
		];

		let ret: any[] = [
			{ id: I.FormulaType.None, name: translate('commonNone') },
		];

		switch (type) {
			case I.RelationType.Date: {
				ret = ret.concat([
					...common,
					{ id: I.FormulaType.MathMin, name: translate('formulaDateMin'), short: translate('formulaDateMinShort'), section: I.FormulaSection.Date },
					{ id: I.FormulaType.MathMax, name: translate('formulaDateMax'), short: translate('formulaDateMaxShort'), section: I.FormulaSection.Date },
					{ id: I.FormulaType.Range, name: translate('formulaDateRange'), short: translate('formulaDateRangeShort'), section: I.FormulaSection.Date },
				]);
				break;
			};

			case I.RelationType.Checkbox: {
				ret = ret.concat([
					{ id: I.FormulaType.Count, name: translate('formulaCheckboxCount'), short: translate('formulaCount'), section: I.FormulaSection.Count },
					{ id: I.FormulaType.CountNotEmpty, name: translate('formulaCheckboxNotEmpty'), short: translate('formulaCheckboxNotEmptyShort'), section: I.FormulaSection.Count },
					{ id: I.FormulaType.CountEmpty, name: translate('formulaCheckboxEmpty'), short: translate('formulaCheckboxEmptyShort'), section: I.FormulaSection.Count },
					{ id: I.FormulaType.PercentNotEmpty, name: translate('formulaCheckboxPercentNotEmpty'), short: translate('formulaNotEmptyShort'), section: I.FormulaSection.Percent },
					{ id: I.FormulaType.PercentEmpty, name: translate('formulaCheckboxPercentEmpty'), short: translate('formulaEmptyShort'), section: I.FormulaSection.Percent },
				]);
				break;
			};

			case I.RelationType.Number: {
				ret = ret.concat([
					...common,
					{ id: I.FormulaType.MathSum, name: translate('formulaSum'), section: I.FormulaSection.Math },
					{ id: I.FormulaType.MathAverage, name: translate('formulaAverage'), section: I.FormulaSection.Math },
					{ id: I.FormulaType.MathMedian, name: translate('formulaMedian'), section: I.FormulaSection.Math },
					{ id: I.FormulaType.MathMin, name: translate('formulaMin'), section: I.FormulaSection.Math },
					{ id: I.FormulaType.MathMax, name: translate('formulaMax'), section: I.FormulaSection.Math },
					{ id: I.FormulaType.Range, name: translate('formulaRange'), section: I.FormulaSection.Math },
				]);
				break;
			};
			
			default: {
				ret = ret.concat(common);
				break;
			};

		};

		if (skipEmptyKeys.includes(relationKey)) {
			ret = ret.filter(it => !skipEmpty.includes(it.id));
		};
		if (relation.maxCount == 1) {
			ret = ret.filter(it => !skipUnique.includes(it.id));
		};
		if (!isArrayType) {
			ret = ret.filter(it => ![ I.FormulaType.CountValue ].includes(it.id));
		};

		return U.Menu.prepareForSelect(ret);
	};

	/**
	 * Returns filter conditions for dictionary relations.
	 * @returns {Array<{id: I.FilterCondition, name: string}>} The filter conditions.
	 */
	public filterConditionsDictionary () {
		return [ 
			{ id: I.FilterCondition.None,		 name: translate('filterConditionNone') }, 
			{ id: I.FilterCondition.Equal,		 name: translate('filterConditionEqual') }, 
			{ id: I.FilterCondition.NotEqual,	 name: translate('filterConditionNotEqual') }, 
			{ id: I.FilterCondition.Empty,		 name: translate('filterConditionEmpty') }, 
			{ id: I.FilterCondition.NotEmpty,	 name: translate('filterConditionNotEmpty') },
		];
	};

	/**
	 * Returns quick filter options for a relation type and condition.
	 * @param {I.RelationType} type - The relation type.
	 * @param {I.FilterCondition} condition - The filter condition.
	 * @returns {Array<{id: I.FilterQuickOption, name: string}>} The quick options.
	 */
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
					I.FilterQuickOption.LastYear,
					I.FilterQuickOption.CurrentYear,
					I.FilterQuickOption.NextYear,
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

	/**
	 * Formats a value for a relation, converting to the correct type.
	 * @param {any} relation - The relation object.
	 * @param {any} value - The value to format.
	 * @param {boolean} maxCount - Whether to limit to maxCount.
	 * @returns {any} The formatted value.
	 */
	public formatValue (relation: any, value: any, maxCount: boolean) {
		if (!relation) {
			return value;
		};

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
				if ((relation.relationKey == 'addedDate') && (value === 0)) {
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
				value = this.getArrayValue(U.Common.objectCopy(value));

				if (maxCount && relation.maxCount) {
					value = value.slice(value.length - relation.maxCount, value.length);
				};
				break;
			};
		};
		return value;
	};

	/**
	 * Checks if a value is valid for a relation.
	 * @param {any} relation - The relation object.
	 * @param {any} value - The value to check.
	 * @returns {boolean} True if valid.
	 */
	public checkRelationValue (relation: any, value: any): boolean {
		if (!relation) {
			return false;
		};

		value = this.formatValue(relation, value, false);

		let ret = false;
		switch (relation.format) {
			default: {
				ret = !!value;
				break;
			};

			case I.RelationType.Checkbox: {
				ret = true;
				break;
			};

			case I.RelationType.Select: {
				ret = Array.isArray(value) ? !!value[0] : !!value.length;
				break;
			};

			case I.RelationType.File:
			case I.RelationType.MultiSelect:
			case I.RelationType.Object:
			case I.RelationType.Relations: {
				ret = !!value.length;
				break;
			};
		};
		return ret;
	};

	/**
	 * Maps a value for a relation key to a display value.
	 * @param {any} relation - The relation object.
	 * @param {any} value - The value to map.
	 * @returns {any} The mapped value.
	 */
	public mapValue (relation: any, value: any) {
		switch (relation.relationKey) {
			case 'sizeInBytes': {
				return U.File.size(value);
			};

			case 'widthInPixels':
			case 'heightInPixels': {
				return U.Common.formatNumber(value) + 'px';
			};

			case 'layout': {
				value = Number(value) || I.ObjectLayout.Page;
				return I.ObjectLayout[value];
			};

			case 'origin': {
				value = Number(value) || I.ObjectOrigin.None;
				return translate(`origin${value}`);
			};

			case 'importType': {
				const names = U.Menu.getImportNames();
				return undefined === value ? null : names[Number(value)];
			};

		};
		return null;
	};

	/**
	 * Gets options for a relation value array.
	 * @param {any[]} value - The value array.
	 * @returns {any[]} The options.
	 */
	public getOptions (value: any[]) {
		return this.getArrayValue(value).map(id => S.Record.getOption(id)).filter(it => it && !it._empty_);
	};

	/**
	 * Gets filter options for a dataview.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID.
	 * @param {I.View} view - The view object.
	 * @returns {any[]} The filter options.
	 */
	public getFilterOptions (rootId: string, blockId: string, view: I.View) {
		const ret: any[] = [];
		const relations: any[] = Dataview.viewGetRelations(rootId, blockId, view).filter((it: I.ViewRelation) => { 
			const relation = S.Record.getRelationByKey(it.relationKey);
			return !!relation;
		});

		relations.forEach((it: I.ViewRelation) => {
			const relation: any = S.Record.getRelationByKey(it.relationKey);
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

	/**
	 * Gets size options for cards.
	 * @returns {Array<{id: I.CardSize, name: string}>} The size options.
	 */
	public getSizeOptions () {
		return U.Menu.prepareForSelect([
			{ id: I.CardSize.Small, name: translate('libRelationSmall') },
			{ id: I.CardSize.Medium, name: translate('libRelationMedium') },
			{ id: I.CardSize.Large, name: translate('libRelationLarge') },
		]);
	};

	/**
	 * Gets cover options for a dataview.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID.
	 * @returns {any[]} The cover options.
	 */
	public getCoverOptions (rootId: string, blockId: string) {
		const formats = [ I.RelationType.File ];
		const options: any[] = U.Common.objectCopy(S.Record.getDataviewRelations(rootId, blockId)).filter(it => {
			if (it.relationKey == 'picture') {
				return true;
			};
			return !it.isHidden && formats.includes(it.format);
		}).map(it => ({
			id: it.relationKey, 
			icon: `relation ${this.className(it.format)}`,
			name: it.name, 
		}));

		const ret = [
			{ id: '', icon: '', name: translate('commonNone') },
			{ id: J.Relation.pageCover, icon: 'image', name: translate('libRelationPageCover') },
		];

		if (!options.find(it => it.id == 'picture')) {
			ret.push({ 
				id: 'picture', 
				icon: `relation ${this.className(I.RelationType.File)}`,
				name: translate('libRelationPicture'),
			});
		};

		return ret.concat(options);
	};

	/**
	 * Gets group types for a view type.
	 * @param {I.ViewType} type - The view type.
	 * @returns {RelationType[]} The relation types.
	 */
	public getGroupTypes (type: I.ViewType): I.RelationType[] {
		let types = [];

		switch (type) {
			case I.ViewType.Board: {
				types = [ I.RelationType.Select, I.RelationType.MultiSelect, I.RelationType.Checkbox ];
				break;
			};

			case I.ViewType.Calendar:
			case I.ViewType.Timeline: {
				types = [ I.RelationType.Date ];
				break;
			};
		};

		return types;
	};

	/**
	 * Gets group options for a dataview.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID.
	 * @param {I.ViewType} type - The view type.
	 * @returns {any[]} The group options.
	 */
	public getGroupOptions (rootId: string, blockId: string, type: I.ViewType): any[] {
		const types = this.getGroupTypes(type);
		const setOf = this.getSetOfObjects(rootId, rootId, I.ObjectLayout.Relation);
		const options: any[] = setOf.concat(S.Record.getDataviewRelations(rootId, blockId)).filter(it => types.includes(it.format) && !it.isHidden);
		
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

		return U.Common.arrayUniqueObjects(options, 'relationKey').map(it => ({
			id: it.relationKey, 
			icon: 'relation ' + this.className(it.format),
			name: it.name, 
		}));
	};

	/**
	 * Gets the group option for a dataview by relation key.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID.
	 * @param {I.ViewType} type - The view type.
	 * @param {string} relationKey - The relation key.
	 * @returns {any} The group option.
	 */
	public getGroupOption (rootId: string, blockId: string, type: I.ViewType, relationKey: string) {
		const groupOptions = this.getGroupOptions(rootId, blockId, type);

		return groupOptions.length ? (groupOptions.find(it => it.id == relationKey) || groupOptions[0]) : null;
	};

	/**
	 * Gets page limit options for a view type.
	 * @param {I.ViewType} type - The view type.
	 * @param {boolean} isInline - Whether the view is inline.
	 * @returns {Array<{id: number, name: number}>} The page limit options.
	 */
	public getPageLimitOptions (type: I.ViewType, isInline: boolean) {
		let options = [ 10, 20, 50, 70, 100 ];
		if (type == I.ViewType.Gallery) {
			options = isInline ? [ 12, 24, 60, 84, 120 ] : [ 60, 84, 120 ];
		};
		return options.map(it => ({ id: it, name: it }));
	};

	/**
	 * Gets dictionary options for a relation key.
	 * @param {string} relationKey - The relation key.
	 * @returns {Array<{id: string, name: string}>} The dictionary options.
	 */
	public getDictionaryOptions (relationKey: string) {
		const names = U.Menu.getImportNames();
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

	/**
	 * Converts a value to a number, or null if invalid.
	 * @param {any} value - The value to convert.
	 * @returns {any} The number value or null.
	 */
	public getNumberValue (value: any): any {
		if (value === 0) {
			return value;
		};

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

	/**
	 * Converts a value to a string.
	 * @param {any} value - The value to convert.
	 * @returns {string} The string value.
	 */
	public getStringValue (value: any): string {
		if ((typeof value === 'object') && value && U.Common.hasProperty(value, 'length')) {
			value = value.length ? value[0] : '';
		};
		return String(value || '');
	};

	/**
	 * Converts a value to an array of strings.
	 * @param {any} value - The value to convert.
	 * @returns {any[]} The array value.
	 */
	public getArrayValue (value: any): any[] {
		if (this.isEmpty(value)) {
			return [];
		};
		if (typeof value !== 'object') {
			return [ value ];
		};
		if (!U.Common.objectLength(value)) {
			return [];
		};
		return U.Common.arrayUnique(value.map(it => String(it || '')).filter(it => !this.isEmpty(it)));
	};

	/**
	 * Checks if a value is empty (null, undefined, empty string, or empty array).
	 * @param {any} v - The value to check.
	 * @returns {boolean} True if empty.
	 */
	public isEmpty (v: any) {
		return (v === null) || (v === undefined) || (v === '') || (Array.isArray(v) && !v.length);
	};

	/**
	 * Checks if a relation type is a URL, email, or phone.
	 * @param {I.RelationType} type - The relation type.
	 * @returns {boolean} True if URL/email/phone.
	 */
	public isUrl (type: I.RelationType) {
		return [ I.RelationType.Url, I.RelationType.Email, I.RelationType.Phone ].includes(type);
	};

	/**
	 * Checks if a relation type is text-like (URL, number, or short text).
	 * @param {I.RelationType} type - The relation type.
	 * @returns {boolean} True if text-like.
	 */
	public isText (type: I.RelationType) {
		return this.isUrl(type) || [ I.RelationType.Number, I.RelationType.ShortText ].includes(type);
	};

	/**
	 * Checks if a relation type is a date.
	 * @param {I.RelationType} type - The relation type.
	 * @returns {boolean} True if date.
	 */
	public isDate (type: I.RelationType) {
		return type == I.RelationType.Date;
	};

	/**
	 * Gets the URL scheme for a relation type.
	 * @param {I.RelationType} type - The relation type.
	 * @param {string} value - The value.
	 * @returns {string} The URL scheme.
	 */
	public getUrlScheme (type: I.RelationType, value: string): string {
		value = String(value || '');

		let ret = '';
		if (type == I.RelationType.Url) {
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

	/**
	 * Ensures a value has the correct URL scheme for a relation type.
	 * @param {I.RelationType} type - The relation type.
	 * @param {string} value - The value.
	 * @returns {string} The value with scheme.
	 */
	public checkUrlScheme (type: I.RelationType, value: string): string {
		value = String(value || '');

		if (!value) {
			return '';
		};
		
		const scheme = U.Common.getScheme(value);
		return scheme ? value : this.getUrlScheme(type, value) + value;
	};

	/**
	 * Gets the setOf value as an array of objects for an object in the store.
	 * @param {string} rootId - The root object ID.
	 * @param {string} objectId - The object ID.
	 * @param {I.ObjectLayout} layout - The object layout.
	 * @returns {any[]} The set of objects.
	 */
	public getSetOfObjects (rootId: string, objectId: string, layout: I.ObjectLayout): any[] {
		const object = S.Detail.get(rootId, objectId, [ 'setOf' ]);
		const setOf = this.getArrayValue(object.setOf);
		const ret = [];

		setOf.forEach((id: string) => {
			let el = null;

			switch (layout) {
				case I.ObjectLayout.Type: {
					el = S.Record.getTypeById(id);
					break;
				};

				case I.ObjectLayout.Relation: {
					el = S.Record.getRelationById(id);
					break;
				};
			};

			if (el) {
				ret.push(el);
			};
		});

		return ret;
	};

	/**
	 * Gets a timestamp for a quick filter option.
	 * @param {any} value - The value.
	 * @param {I.FilterQuickOption} option - The quick option.
	 * @returns {number} The timestamp.
	 */
	public getTimestampForQuickOption (value: any, option: I.FilterQuickOption) {
		const time = U.Date.now();

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

	/**
	 * Gets parameters for creating a new object from a relation.
	 * @param {string} name - The object name.
	 * @param {any} relation - The relation object.
	 * @returns {{ flags: I.ObjectFlag[], details: any }} The parameters.
	 */
	getParamForNewObject (name: string, relation: any): { flags: I.ObjectFlag[], details: any } {
		const details: any = { name };
		const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate ];
		const objectTypes = this.getArrayValue(relation.objectTypes);
		const skipLayouts = U.Object.getFileAndSystemLayouts().concat(I.ObjectLayout.Participant);

		let type = null;

		if (objectTypes.length) {
			const allowedTypes = objectTypes.map(id => S.Record.getTypeById(id)).filter(it => it && !skipLayouts.includes(it.recommendedLayout));
			const l = allowedTypes.length;

			if (l) {
				type = allowedTypes[0];
			};
		};

		if (type && (type.uniqueKey == J.Constant.typeKey.template)) {
			type = null;
		};

		details.type = type ? type.id : S.Common.type;

		return { flags, details };
	};

	/**
	 * Gets the list of system relation keys.
	 * @returns {string[]} The system keys.
	 */
	systemKeys () {
		return require('lib/json/generated/systemRelations.json');
	};

	/**
	 * Gets the list of system relation keys, excluding user keys.
	 * @returns {string[]} The system keys without user keys.
	 */
	systemKeysWithoutUser () {
		return this.systemKeys().filter(it => !SKIP_SYSTEM_KEYS.includes(it));
	};

	/**
	 * Checks if a relation key is a system key.
	 * @param {string} relationKey - The relation key.
	 * @returns {boolean} True if system key.
	 */
	isSystem (relationKey: string): boolean {
		return this.systemKeys().includes(relationKey);
	};

	/**
	 * Checks if a relation key is a system key (excluding user keys).
	 * @param {string} relationKey - The relation key.
	 * @returns {boolean} True if system key without user.
	 */
	isSystemWithoutUser (relationKey: string): boolean {
		return this.systemKeysWithoutUser().includes(relationKey);
	};

	/**
	 * Checks if a relation key is a dictionary key.
	 * @param {string} relationKey - The relation key.
	 * @returns {boolean} True if dictionary key.
	 */
	isDictionary (relationKey: string): boolean {
		return DICTIONARY.includes(relationKey);
	};

	/**
	 * Gets the list of array relation types.
	 * @returns {I.RelationType[]} The array types.
	 */
	arrayTypes () {
		return [ I.RelationType.Select, I.RelationType.MultiSelect, I.RelationType.File, I.RelationType.Object, I.RelationType.Relations ];
	};

	/**
	 * Checks if a relation type is an array type.
	 * @param {I.RelationType} format - The relation type.
	 * @returns {boolean} True if array type.
	 */
	isArrayType (format: I.RelationType): boolean {
		return this.arrayTypes().includes(format);
	};
	
};

export default new Relation();