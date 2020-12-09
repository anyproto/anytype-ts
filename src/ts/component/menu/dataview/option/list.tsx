import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Tag, Label } from 'ts/component';
import { I, Util, DataUtil, translate } from 'ts/lib';
import arrayMove from 'array-move';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface Props extends I.Menu {};

const $ = require('jquery');

@observer
class MenuOptionList extends React.Component<Props> {
	
	_isMounted: boolean = false;
	
	constructor (props: any) {
		super(props);
		
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const value = data.value || [];
		const relation = data.relation.get();
		const filter = new RegExp(Util.filterFix(data.filter), 'gi');

		let options = relation.selectDict || [];
		if (filter) {
			options = options.filter((it: I.SelectOption) => { return it.text.match(filter); });
		};

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			return (
				<div id={'tag-' + item.id} className="item" onClick={(e: any) => { this.onSelect(e, item); }}>
					<Handle />
					<Tag text={item.text} color={item.color} />
					<Icon className="more" onClick={(e: any) => { this.onEdit(e, item); }} />
				</div>
			);
		});
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{options.map((item: any, i: number) => (
						<Item key={i} {...item} index={i} />
					))}
				</div>
			);
		});
		
		return (
			<div>
				<Label text={translate('menuDataviewOptionListCreate')} />
				<List 
					axis="y" 
					transitionDuration={150}
					distance={10}
					useDragHandle={true}
					onSortEnd={this.onSortEnd}
					helperClass="isDragging"
					helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
		this.props.position();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onSelect (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		let value = Util.objectCopy(data.value || []);
		value.push(item.id);
		value = Util.arrayUnique(value);

		this.props.param.data.value = value;
		onChange(value);
	};
	
	onEdit (e: any, item: any) {
		e.stopPropagation();

		const { param } = this.props;
		const { data } = param;

		commonStore.menuOpen('dataviewOptionEdit', { 
			type: I.MenuType.Vertical,
			element: '#tag-' + item.id,
			offsetX: param.width,
			offsetY: 0,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Left,
			data: {
				...data,
				option: item,
			}
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const relation = data.relation.get();
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == this.props.id; });

		relation.selectDict = arrayMove(relation.selectDict, oldIndex, newIndex);
		data.relation.set(relation);
		DataUtil.dataviewRelationUpdate(rootId, blockId, relation);

		if (menu) {
			menu.param.data.relation = observable.box(relation);
			commonStore.menuUpdate(this.props.id, menu.param);
		};
	};
	
};

export default MenuOptionList;