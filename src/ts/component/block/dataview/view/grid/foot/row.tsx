import React, { forwardRef, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { I, Dataview } from 'Lib';
import Cell from './cell';

interface Props extends I.ViewComponent {
	getColumnWidths?: (relationId: string, width: number) => any;
};

const FootRow = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, block, isInline, isCollection, getView, getKeys, getSources, getVisibleRelations, getColumnWidths, getSearchIds } = props;
	const widths = getColumnWidths('', 0);
	const relations = getVisibleRelations();
	const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
	const cellRefs = useRef({});

	const init = () => {
		const relations = getVisibleRelations();
		const check = relations.filter(it => it.formulaType != I.FormulaType.None);

		if (!check.length) {
			return;
		};

		const view = getView();
		const keys = getKeys(view.id);
		const sources = getSources();
		const collectionId = isCollection ? (isInline ? block.getTargetObjectId() : rootId) : '';
		const filters: I.Filter[] = [];
		const searchIds = getSearchIds();

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		Dataview.getData({
			rootId, 
			blockId: block.id, 
			subId: [ rootId, block.id, 'total' ].join('-'),
			newViewId: view.id,
			keys, 
			offset: 0, 
			limit: 0, 
			clear: true,
			sources,
			filters,
			collectionId,
		}, () => {
			relations.forEach(relation => {
				cellRefs.current[relation.relationKey]?.calculate();
			});
		});
	};

	useEffect(() => init());

	return (
		<div 
			id="rowFoot"
			className="rowFoot"
			style={{ gridTemplateColumns: str }}
		>
			{relations.map((relation: any, i: number) => (
				<Cell
					{...props}
					ref={ref => cellRefs.current[relation.relationKey] = ref}
					key={`grid-foot-${relation.relationKey}`}
					relationKey={relation.relationKey}
				/>
			))}
			<div className="cellFoot last" />
		</div>
	);

}));

export default FootRow;