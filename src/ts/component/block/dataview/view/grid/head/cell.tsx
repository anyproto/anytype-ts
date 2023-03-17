import * as React from 'react';
import { I, keyboard, Relation, Dataview } from 'Lib';
import { SortableElement } from 'react-sortable-hoc';
import { menuStore, dbStore } from 'Store';
import { observer } from 'mobx-react';
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
	};

	render () {
		const { relationKey, index, onResizeStart } = this.props;
		const relation = dbStore.getRelationByKey(relationKey);
		
		if (!relation) {
			return;
		};

		const { format, name } = relation;
		const readonly = relation.isReadonlyValue;

		const Cell = SortableElement((item: any) => {
			const cn = [ 'cellHead', Relation.className(format) ];

			return (
				<div 
					id={Relation.cellId('head', relationKey, '')} 
					className={cn.join(' ')}
					onClick={this.onEdit}
					onContextMenu={this.onEdit}
				>
					<div className="cellContent">
						<Handle name={name} format={format} readonly={readonly} />
						<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, relationKey); }} />
					</div>
				</div>
			);
		});

		return <Cell index={index} />;
	};

	onEdit (e: any) {
		const { rootId, block, readonly, loadData, getView, relationKey, isInline, isCollection } = this.props;
		const relation = dbStore.getRelationByKey(relationKey);

		if (!relation || keyboard.isResizing) {
			return;
		};

		const element = `#block-${block.id} #${Relation.cellId('head', relationKey, '')}`;
		const obj = $(element);

		menuStore.open('dataviewRelationEdit', { 
			element,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			onOpen: () => { obj.addClass('active'); },
			onClose: () => { obj.removeClass('active'); },
			data: {
				loadData,
				getView,
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
	};

});

export default HeadCell;