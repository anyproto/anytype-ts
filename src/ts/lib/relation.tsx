import { I, DataUtil, Util, FileUtil, translate } from 'ts/lib';
import { dbStore } from 'ts/store';

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
					{ id: I.FilterCondition.Equal,		 name: translate('filterConditionEqual') },
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
		let ret: any[] = [
			{ id: I.FilterQuickOption.None, name: 'None' },
		];

		switch (type) {
			case I.RelationType.Date:
				switch (condition) {
					case I.FilterCondition.Equal:
						ret = ret.concat([
							{ id: I.FilterQuickOption.Today, name: 'Today' },
							{ id: I.FilterQuickOption.Tomorrow, name: 'Tomorrow' },
							{ id: I.FilterQuickOption.Yesterday, name: 'Yesterday' },
						]);
						break;

					case I.FilterCondition.Greater:
					case I.FilterCondition.Less:
					case I.FilterCondition.GreaterOrEqual:
					case I.FilterCondition.LessOrEqual:
					case I.FilterCondition.In:
						ret = ret.concat([
							{ id: I.FilterQuickOption.Today,		 name: 'Today' },
							{ id: I.FilterQuickOption.Tomorrow,		 name: 'Tomorrow' },
							{ id: I.FilterQuickOption.Yesterday,	 name: 'Yesterday' },
							{ id: I.FilterQuickOption.LastWeek,		 name: 'Last week' },
							{ id: I.FilterQuickOption.CurrentWeek,	 name: 'Current week' },
							{ id: I.FilterQuickOption.NextWeek,		 name: 'Next week' },
							{ id: I.FilterQuickOption.LastMonth,	 name: 'Last month' },
							{ id: I.FilterQuickOption.CurrentMonth,	 name: 'Current month' },
							{ id: I.FilterQuickOption.NextMonth,	 name: 'Next month' },
						]);
						break;
				};
				break;
		};

		ret = ret.concat([
			{ id: I.FilterQuickOption.NumberOfDaysAgo, name: 'Number of days ago' },
			{ id: I.FilterQuickOption.NumberOfDaysNow, name: 'Number of days from now' },
			{ id: I.FilterQuickOption.ExactDate, name: 'Exact date' },
		]);

		return ret;
	};

	formatValue (relation: any, value: any, maxCount: boolean) {
		switch (relation.format) {
			default:
				value = String(value || '');
				break;

			case I.RelationType.Number:
				value = String(value || '').replace(/,\s?/g, '.').replace(/[^\d\.e+]*/gi, '');
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
				value = Util.objectCopy(value || []);
				value = Util.arrayUnique(value);
				value = value.map((it: any) => { return String(it || ''); });
				value = value.filter((it: any) => { return it; });

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

	getOptions (rootId: string, blockId: string, view: I.View) {
		let relations: any[] = DataUtil.viewGetRelations(rootId, blockId, view).filter((it: I.ViewRelation) => { 
			const relation = dbStore.getRelation(rootId, blockId, it.relationKey);
			return relation && (relation.format != I.RelationType.File) && (it.relationKey != Constant.relationKey.done);
		});
		let idxName = relations.findIndex((it: any) => { return it.relationKey == Constant.relationKey.name; });

		relations.splice((idxName >= 0 ? idxName + 1 : 0), 0, {
			relationKey: Constant.relationKey.done,
		});

		let ret: any[] = [];
		relations.forEach((it: I.ViewRelation) => {
			const relation: any = dbStore.getRelation(rootId, blockId, it.relationKey);
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

	getStringValue (value: any) {
		if (('object' == typeof(value)) && value && value.hasOwnProperty('length')) {
			return String(value.length ? value[0] : '');
		} else {
			return String(value || '');
		};
	};

	getArrayValue (value: any): string[] {
		value = Util.objectCopy(value || []);
		if ('object' != typeof(value)) {
			value = value ? [ value ] : [];
		};
		value = value.filter((it: string) => { return it; });
		return Util.arrayUnique(value);
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
	
};

export default new Relation();