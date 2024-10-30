import * as React from 'react';
import { observer } from 'mobx-react';
import { Cell } from 'Component';
import { I, S, U, C, Relation, analytics } from 'Lib';

const PREFIX = 'sidebarObjectRelation';

const SidebarSectionObjectRelation = observer(class SidebarSectionObjectRelation extends React.Component<I.SidebarSectionComponent> {
	
	refCell = null;

	constructor (props: I.SidebarSectionComponent) {
		super(props);

		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
	};

    render () {
		const { rootId, object, isPopup } = this.props;
		const relation = this.props.item;
		const block = S.Block.getLeaf(rootId, object.id);
		const id = Relation.cellId(PREFIX, relation.relationKey, object.id);
		const cn = [ 'cell', Relation.className(relation.format) ];
		const container = [ 
			U.Common.getCellContainer('sidebarRight'), 
			U.Common.getCellContainer(isPopup ? 'popup' : 'page') 
		].join(', ');

		const readonly = false;
		const allowedValue = true;
		const canEdit = !readonly && allowedValue;

		if (canEdit) {
			cn.push('canEdit');
		};

        return (
			<div className="wrap">
				<div className="name">{relation.name}</div>

				<div 
					id={id} 
					className={cn.join(' ')} 
					onClick={this.onCellClick}
				>
					<Cell 
						ref={ref => this.refCell = ref}
						rootId={rootId}
						subId={rootId}
						block={block}
						relationKey={relation.relationKey}
						getRecord={() => object}
						viewType={I.ViewType.Grid}
						readonly={!canEdit}
						idPrefix={PREFIX}
						menuClassNameWrap="fromSidebar"
						menuClassName="fixed"
						onCellChange={this.onCellChange}
						pageContainer={container}
					/>
				</div>
			</div>
		);
    };

	onCellClick (e: any) {
		this.refCell?.onClick(e);
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { object } = this.props;
		const relation = S.Record.getRelationByKey(relationKey);

		C.ObjectListSetDetails([ object.id ], [ { key: relationKey, value: Relation.formatValue(relation, value, true) } ], callBack);

		if ((undefined !== object[relationKey]) && !U.Common.compareJSON(object[relationKey], value)) {
			analytics.changeRelationValue(relation, value, { type: 'menu', id: 'Single' });
		};
	};

});

export default SidebarSectionObjectRelation;