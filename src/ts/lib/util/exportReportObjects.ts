import type { ExportReport } from 'Proto/pkg/lib/pb/model/protos/export_report';
import * as I from 'Interface';

export const loadExportReportObjects = (spaceId: string, report: ExportReport, callBack: (objects: Record<string, any>) => void): (() => void) => {
	const ids = Array.from(new Set((report?.issues || []).map(it => it.objectId).filter(Boolean)));
	const objects: Record<string, any> = {};
	let canceled = false;
	const cancel = () => { canceled = true; };

	if (!spaceId || !ids.length) {
		callBack(objects);
		return cancel;
	};

	const search = (objectIds: string[], done: () => void) => {
		const filters = [
			{ relationKey: 'id', condition: I.FilterCondition.In, value: objectIds },
			{ relationKey: 'isArchived', condition: I.FilterCondition.None, value: null },
		];
		C.ObjectSearch(spaceId, filters, [], J.Relation.default, '', 0, objectIds.length, message => {
			if (canceled) {
				return;
			};
			for (const record of message.records || []) {
				objects[record.id] = S.Detail.mapper(record);
			};
			done();
		});
	};

	search(ids, () => {
		// Resolve type names in the export's space too, even if the user has switched spaces.
		const typeIds = Array.from(new Set(Object.values(objects).map(it => it.type).filter(id => id && !objects[id])));
		if (typeIds.length) {
			search(typeIds, () => callBack(objects));
		} else {
			callBack(objects);
		};
	});
	return cancel;
};
