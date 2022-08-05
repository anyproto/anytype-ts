import * as React from 'react';
import { Cell, Icon } from 'ts/component';
import { I, Util, DataUtil, Relation } from 'ts/lib';
import { detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	relationKey: string;
	name: string;
	format: I.RelationType;
	isHidden: boolean;
	dataset?: any;
	rootId: string;
	block?: I.Block;
	isFeatured?: boolean;
	classNameWrap?: string;
	readonly?: boolean;
	canEdit?: boolean;
	canDrag?: boolean;
	canFav?: boolean;
	onEdit(e: any, relationKey: string): void;
	onRef(id: string, ref: any): void;
	onFav(e: any, item: any): void;
	onCellClick(e: any, relationKey: string, index: number): void;
	onCellChange(id: string, relationKey: string, value: any, callBack?: (message: any) => void): void;
	optionCommand(code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: any, callBack?: (message: any) => void): void;
};

const PREFIX = 'menuBlockRelationView';

const MenuItemRelationView = observer(class MenuItemRelationView extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	public static defaultProps = {
		readonly: true,
		canEdit: false,
		canFav: false,
		isFeatured: false,
		classNameWrap: '',
		onEdit: () => {},
		onRef: () => {},
		onFav: () => {},
		onCellClick: () => {},
		onCellChange: () => {},
		optionCommand: () => {},
	};

	constructor (props: any) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
	};

	render () {
		const { rootId, block, relationKey, canEdit, canDrag, canFav, readonly, format, name, isHidden, isFeatured, classNameWrap, onEdit, onRef, onFav, onCellClick, onCellChange, optionCommand } = this.props;

		const id = Relation.cellId(PREFIX, relationKey, '0');
		const fcn = [ 'fav' ];
		const tooltip = isFeatured ? 'Remove from featured relations' : 'Add to featured relations';
		const cn = [ 'item', 'sides' ];
		const object = detailStore.get(rootId, rootId, [ relationKey ]);
		const value = object[relationKey];

		if (isHidden) {
			cn.push('isHidden');
		};
		if (canFav) {
			cn.push('canFav');
		};
		if (isFeatured) {
			fcn.push('active');
		};

		return (
			<div className={cn.join(' ')}>
				<div 
					id={`item-${relationKey}`} 
					className={[ 'info', (canEdit ? 'canEdit' : '') ].join(' ')} 
					onClick={(e: any) => { onEdit(e, relationKey); }}
				>
					{canDrag ? <Icon className="dnd" draggable={true} onDragStart={this.onDragStart} /> : ''}
					{readonly ? <Icon className="lock" /> : ''}
					{name}
				</div>
				<div
					id={id} 
					className={[ 'cell', DataUtil.relationClass(format), (!readonly ? 'canEdit' : '') ].join(' ')} 
				>
					<Cell 
						ref={(ref: any) => { onRef(id, ref); }} 
						rootId={rootId}
						subId={rootId}
						storeId={rootId}
						block={block}
						relationKey={relationKey}
						getRecord={() => { return object; }}
						viewType={I.ViewType.Grid}
						index={0}
						idPrefix={PREFIX}
						menuClassName="fromBlock"
						menuClassNameWrap={classNameWrap}
						bodyContainer={Util.getBodyContainer('menuBlockRelationView')}
						pageContainer={Util.getCellContainer('menuBlockRelationView')}
						readonly={readonly}
						onClick={(e: any) => { onCellClick(e, relationKey, 0); }}
						onCellChange={onCellChange}
						optionCommand={optionCommand}
					/>
					{canFav ? (
						<Icon className={fcn.join(' ')} onClick={(e: any) => { onFav(e, relationKey); }} tooltip={tooltip} />
					) : ''}
				</div>
			</div>
		);
    };

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onDragStart (e: any) {
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};
		
		const { dataset, relationKey } = this.props;
		const { selection, onDragStart } = dataset || {};

		if (!selection || !onDragStart) {
			return;
		};
		
		selection.preventSelect(true);
		selection.clear(false);

		onDragStart(e, I.DropType.Relation, [ relationKey ], this);
	};

});

export default MenuItemRelationView;