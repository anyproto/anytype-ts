import * as React from 'react';
import { observer } from 'mobx-react';
import { SortableElement } from 'react-sortable-hoc';
import { I, S, keyboard, Relation, Dataview } from 'Lib';
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
		const { rootId, block, relationKey, index, onResizeStart, readonly } = this.props;
		const relation = S.Record.getRelationByKey(relationKey);
		
		if (!relation) {
			return;
		};

		const allowed = !readonly && S.Block.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const cn = [ 'cellHead', `cell-key-${this.props.relationKey}`, Relation.className(relation.format) ];

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

		if (!keyboard.isDragging) {
			$(`#block-${block.id} .cell-key-${relationKey}`).addClass('cellKeyHover');
		};
	};

	onMouseLeave () {
		$('.cellKeyHover').removeClass('cellKeyHover');
	};

	onEdit (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { block, getView, relationKey } = this.props;
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

		window.setTimeout(() => {
			S.Menu.open('dataviewRelationEdit', { 
				element,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				onOpen: () => obj.addClass('active'),
				onClose: () => obj.removeClass('active'),
				className: isFixed ? 'fixed' : '',
				data: {
					...this.props,
					blockId: block.id,
					relationId: relation.id,
					extendedOptions: true,
					addCommand: (rootId: string, blockId: string, relation: any) => {
						Dataview.relationAdd(rootId, blockId, relation.relationKey, relation._index_, getView());
					},
				}
			});
		}, S.Menu.getTimeout());
	};

});

export default HeadCell;