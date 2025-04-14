import * as React from 'react';
import { observer } from 'mobx-react';
import { SortableElement } from 'react-sortable-hoc';
import { I, S, J, U, C, keyboard, Relation, Dataview } from 'Lib';
import Handle from './handle';

interface Props extends I.ViewComponent, I.ViewRelation {
	rootId: string;
	block?: I.Block;
	index: number;
	onResizeStart(e: any, key: string): void;
};

const HeadCell = observer(class HeadCell extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onEdit = this.onEdit.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { rootId, block, relationKey, index, onResizeStart, getView, readonly } = this.props;
		const relation = S.Record.getRelationByKey(relationKey);
		
		if (!relation) {
			return null;
		};

		const view = getView();
		const viewRelation = view?.getRelation(relationKey);
		const allowed = !readonly && S.Block.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const cn = [ 'cellHead', `cell-key-${relationKey}`, Relation.className(relation.format), `align${viewRelation?.align}` ];

		if (allowed) {
			cn.push('canDrag');
		};

		const Cell = SortableElement((item: any) => (
			<div 
				id={Relation.cellId('head', relationKey, '')} 
				className={cn.join(' ')}
				onClick={this.onEdit}
				onContextMenu={this.onEdit}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
			>
				<div className="cellContent">
					<Handle name={relation.name} format={relation.format} readonly={relation.isReadonlyValue} />
					{allowed ? <div className="resize" onMouseDown={e => onResizeStart(e, relationKey)} /> : ''}
				</div>
			</div>
		));

		return <Cell index={index} disabled={!allowed} />;
	};

	onMouseEnter (): void {
		const { block, relationKey } = this.props;

		if (!keyboard.isDragging && !keyboard.isResizing) {
			$(`#block-${block.id} .cell-key-${relationKey}`).addClass('cellKeyHover');
		};
	};

	onMouseLeave () {
		if (!keyboard.isDragging && !keyboard.isResizing) {
			$('.cellKeyHover').removeClass('cellKeyHover');
		};
	};

	onEdit (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId, block, getView, relationKey } = this.props;
		const relation = S.Record.getRelationByKey(relationKey);

		if (!relation || keyboard.isResizing) {
			return;
		};

		const blockEl =	`#block-${block.id}`;
		const rowHead = $(`${blockEl} #rowHead`);
		const isFixed = rowHead.hasClass('fixed');
		const headEl = isFixed ? `#rowHeadClone` : `#rowHead`;
		const element = `${blockEl} ${headEl} #${Relation.cellId('head', relationKey, '')}`;
		const obj = $(element);
		const object = S.Detail.get(rootId, rootId);
		const isType = U.Object.isTypeLayout(object.layout);
		const view = getView();

		let unlinkCommand = null;
		if (isType) {
			unlinkCommand = (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
				U.Object.typeRelationUnlink(object.id, relation.id, onChange);
			};
		};

		window.setTimeout(() => {
			S.Menu.open('dataviewRelationEdit', { 
				element,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				onOpen: () => obj.addClass('active'),
				onClose: () => obj.removeClass('active'),
				className: isFixed ? 'fixed' : '',
				subIds: J.Menu.relationEdit,
				data: {
					...this.props,
					blockId: block.id,
					relationId: relation.id,
					extendedOptions: true,
					unlinkCommand,
					addCommand: (rootId: string, blockId: string, relation: any) => {
						Dataview.addTypeOrDataviewRelation(rootId, blockId, relation, object, view, relation._index_);
					},
				}
			});
		}, S.Menu.getTimeout());
	};

});

export default HeadCell;