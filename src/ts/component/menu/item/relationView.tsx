import * as React from 'react';
import { Cell, Icon } from 'Component';
import { I, UtilCommon, Relation, keyboard, translate } from 'Lib';
import { detailStore } from 'Store';
import { observer } from 'mobx-react';

interface Props {
	id: string;
	relationKey: string;
	name: string;
	format: I.RelationType;
	isHidden: boolean;
	dataset?: I.Dataset;
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
	onCellClick(e: any, relationKey: string, id: string): void;
	onCellChange(id: string, relationKey: string, value: any, callBack?: (message: any) => void): void;
};

const PREFIX = 'menuBlockRelationView';

const MenuItemRelationView = observer(class MenuItemRelationView extends React.Component<Props> {

	public static defaultProps = {
		readonly: true,
		canEdit: false,
		canFav: false,
		isFeatured: false,
		classNameWrap: '',
	};

	_isMounted = false;

	constructor (props: Props) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
	};

	render () {
		const { rootId, block, id, relationKey, canEdit, canDrag, canFav, readonly, format, name, isHidden, isFeatured, classNameWrap, onEdit, onRef, onFav, onCellClick, onCellChange } = this.props;
		const tooltip = translate(isFeatured ? 'menuItemRelationViewFeaturedRemove' : 'menuItemRelationViewFeaturedAdd');
		const object = detailStore.get(rootId, rootId, [ relationKey ]);
		const cellId = Relation.cellId(PREFIX, relationKey, '');
		const value = object[relationKey];

		const cn = [ 'item', 'sides' ];
		const fcn = [ 'fav' ];
		const icn = [ 'info' ];
		const ccn = [ 'cell', Relation.className(format) ];

		if (isHidden) {
			cn.push('isHidden');
		};
		if (canFav) {
			cn.push('canFav');
		};
		if (isFeatured) {
			fcn.push('active');
		};
		if (canEdit) {
			icn.push('canEdit');
		};
		if (!readonly) {
			ccn.push('canEdit');
		};

		return (
			<div id={`item-${id}`} className={cn.join(' ')}>
				{canDrag ? <Icon className="dnd" draggable={true} onDragStart={this.onDragStart} /> : ''}
				<div 
					className={icn.join(' ')} 
					onClick={(e: any) => { onEdit(e, id); }}
				>
					{readonly ? <Icon className="lock" /> : ''}
					{name}
				</div>
				<div id={cellId} className={ccn.join(' ')}>
					<Cell 
						ref={ref => onRef(cellId, ref)} 
						rootId={rootId}
						subId={rootId}
						block={block}
						relationKey={relationKey}
						getRecord={() => object}
						recordId=""
						viewType={I.ViewType.Grid}
						idPrefix={PREFIX}
						menuClassName="fromBlock"
						menuClassNameWrap={classNameWrap}
						bodyContainer={UtilCommon.getBodyContainer('menuBlockRelationView')}
						pageContainer={UtilCommon.getCellContainer('menuBlockRelationView')}
						readonly={readonly}
						onClick={e => onCellClick(e, relationKey, object.id)}
						onCellChange={onCellChange}
					/>
					{canFav ? (
						<Icon className={fcn.join(' ')} tooltip={tooltip} onClick={e => onFav(e, relationKey)} />
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
		
		keyboard.disableSelection(true);
		selection.clear();

		onDragStart(e, I.DropType.Relation, [ relationKey ], this);
	};

});

export default MenuItemRelationView;