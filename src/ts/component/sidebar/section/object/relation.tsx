import * as React from 'react';
import { observer } from 'mobx-react';
import { Cell, Icon } from 'Component';
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
		const { rootId, isPopup, item: relation, onDragStart } = this.props;
		const root = S.Block.getLeaf(rootId, rootId);

		if (!relation || !root) {
			return null;
		};

		const object = S.Detail.get(rootId, rootId, [ relation.relationKey ]);
		const id = Relation.cellId(PREFIX, relation.relationKey, rootId);
		const rc = Relation.className(relation.format);
		const cw = [ 'wrap', rc ];
		const cn = [ 'cell', rc ];
		const readonly = this.props.readonly || root.isLocked();
		const canEdit = !readonly && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const container = [ 
			U.Common.getCellContainer(isPopup ? 'popup' : 'page'),
			U.Common.getCellContainer('sidebarRight'),
		].join(', ');

		if (canEdit) {
			cn.push('canEdit');
		};

        return (
			<div className={cw.join(' ')}>
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
						block={root}
						relationKey={relation.relationKey}
						getRecord={() => object}
						viewType={I.ViewType.Grid}
						readonly={!canEdit}
						idPrefix={PREFIX}
						menuClassNameWrap="fromSidebar"
						menuClassName="fromSidebar fixed"
						onCellChange={this.onCellChange}
						pageContainer={container}
					/>
				</div>

				{relation.onMore ? <Icon className="more" onClick={e => relation.onMore(e, relation)} /> : ''}
			</div>
		);
    };

	onCellClick (e: any) {
		this.refCell?.onClick(e);
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId);
		const relation = S.Record.getRelationByKey(relationKey);
		const val = Relation.formatValue(relation, value, true);

		C.ObjectListSetDetails([ object.id ], [ { key: relationKey, value: val } ], callBack);

		if ((undefined !== object[relationKey]) && !U.Common.compareJSON(object[relationKey], value)) {
			analytics.changeRelationValue(relation, value, { type: 'menu', id: 'Single' });
		};
	};

});

export default SidebarSectionObjectRelation;
