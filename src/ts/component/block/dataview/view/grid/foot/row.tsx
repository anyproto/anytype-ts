import * as React from 'react';
import { observer } from 'mobx-react';
import { I, Dataview } from 'Lib';
import Cell from './cell';

interface Props extends I.ViewComponent {
	getColumnWidths?: (relationId: string, width: number) => any;
};

const FootRow = observer(class FootRow extends React.Component<Props> {

	cellRefs = {};

	render () {
		const { getVisibleRelations, getColumnWidths } = this.props;
		const widths = getColumnWidths('', 0);
		const relations = getVisibleRelations();
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');

		return (
			<div 
				id="rowFoot"
				className="rowFoot"
				style={{ gridTemplateColumns: str }}
			>
				{relations.map((relation: any, i: number) => (
					<Cell
						{...this.props}
						ref={ref => this.cellRefs[relation.relationKey] = ref}
						key={`grid-foot-${relation.relationKey}`}
						relationKey={relation.relationKey}
					/>
				))}
				<div className="cellFoot last" />
			</div>
		);
	};

	componentDidMount (): void {
		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	init () {
		const { rootId, block, isInline, getView, getKeys, getSources, isCollection, getVisibleRelations } = this.props;
		const relations = getVisibleRelations();
		const check = relations.filter(it => it.formulaType != I.FormulaType.None);

		if (!isInline || !check.length) {
			return;
		};

		const view = getView();
		const keys = getKeys(view.id);
		const sources = getSources();
		const collectionId = isCollection ? (isInline ? block.getTargetObjectId() : rootId) : '';

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
			filters: [],
			collectionId,
		}, () => {
			relations.forEach(relation => {
				if (this.cellRefs[relation.relationKey]) {
					this.cellRefs[relation.relationKey].calculate();
				};
			});
		});
	};

});

export default FootRow;