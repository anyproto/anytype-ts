import * as React from 'react';
import { I, keyboard, Relation, Dataview } from 'Lib';
import { SortableElement } from 'react-sortable-hoc';
import { menuStore, dbStore, blockStore } from 'Store';
import { observer } from 'mobx-react';
import Handle from './handle';
const Constant = require('json/constant.json');

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
		const { rootId, block, relationKey, index, onResizeStart } = this.props;
		const relation = dbStore.getRelationByKey(relationKey);
		
		if (!relation) {
			return;
		};

		const { format, name } = relation;
		const readonly = relation.isReadonlyValue;
		const allowedView = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const cn = [ 'cellHead', `cell-key-${this.props.relationKey}`, Relation.className(format) ];

		if (allowedView) {
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
					<Handle name={name} format={format} readonly={readonly} />
					<div className="resize" onMouseDown={e => onResizeStart(e, relationKey)} />
				</div>
			</div>
		));

		return <Cell index={index} disabled={!allowedView} />;
	};

	onMouseEnter (): void {
		const { block } = this.props;

		if (!keyboard.isDragging) {
			$(`#block-${block.id} .cell-key-${this.props.relationKey}`).addClass('cellKeyHover');
		};
	};

	onMouseLeave () {
		$('.cellKeyHover').removeClass('cellKeyHover');
	};

	onEdit (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId, block, readonly, loadData, getView, getTarget, relationKey, isInline, isCollection } = this.props;
		const relation = dbStore.getRelationByKey(relationKey);

		if (!relation || keyboard.isResizing) {
			return;
		};

		const element = `#block-${block.id} #${Relation.cellId('head', relationKey, '')}`;
		const obj = $(element);

		window.setTimeout(() => {
			menuStore.open('dataviewRelationEdit', { 
				element,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				onOpen: () => obj.addClass('active'),
				onClose: () => obj.removeClass('active'),
				data: {
					loadData,
					getView,
					getTarget,
					rootId,
					isInline,
					isCollection,
					blockId: block.id,
					relationId: relation.id,
					readonly,
					extendedOptions: true,
					addCommand: (rootId: string, blockId: string, relation: any) => {
						Dataview.relationAdd(rootId, blockId, relation.relationKey, relation._index_, getView());
					},
				}
			});
		}, menuStore.getTimeout());
	};

});

export default HeadCell;