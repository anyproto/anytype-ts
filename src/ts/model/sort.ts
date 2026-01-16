import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

/**
 * Sort represents a sorting rule for ordering objects in Sets/Collections.
 *
 * Sorts are used in Dataview blocks to determine the order in which
 * objects are displayed. Multiple sorts can be applied in sequence.
 *
 * Properties:
 * - relationKey: The property to sort by (e.g., 'name', 'createdDate')
 * - type: Sort direction (Ascending, Descending, Custom)
 * - customOrder: Explicit ordering for Custom sort type
 * - empty: How to handle empty values (Start, End, None)
 *
 * MobX observable for reactive UI updates.
 */
class Sort implements I.Sort {

	id = '';
	relationKey = '';
	type: I.SortType = I.SortType.Asc;
	customOrder: string[] = [];
	empty: I.EmptyType = I.EmptyType.None;

	constructor (props: I.Sort) {

		this.id = String(props.id || '');
		this.relationKey = String(props.relationKey || '');
		this.type = Number(props.type) || I.SortType.Asc;
		this.customOrder = Array.isArray(props.customOrder) ? props.customOrder : [];
		this.empty = Number(props.empty) || I.SortType.Asc;

		makeObservable(this, {
			relationKey: observable,
			type: observable,
			customOrder: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default Sort;