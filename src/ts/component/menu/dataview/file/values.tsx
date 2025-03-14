import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, IconObject, MenuItemVertical, EmptySearch, ObjectName } from 'Component';
import { I, S, U, J, Relation, Renderer, keyboard, translate } from 'Lib';

const MENU_ID = 'dataviewFileList';

const MenuDataviewFileValues = observer(class MenuDataviewFileValues extends React.Component<I.Menu> {

	_isMounted = false;
	node: any = null;

	constructor (props: I.Menu) {
		super(props);

		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};

	render () {
		const { param, position, getId, setHover } = this.props;
		const { data } = param;
		const { canEdit } = data;
		const items = this.getItems();
		
		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const File = (item: any) => (
			<>
				<IconObject object={item} />
				<ObjectName object={item} />
			</>
		);

		const Image = (item: any) => (
			<img src={S.Common.imageUrl(item.id, 208)} className="img" onLoad={() => position()} />
		);

		const Item = SortableElement((item: any) => {
			const cn = [ 'item' ];

			let content = null;

			switch (item.layout) {
				default: {
					cn.push('isFile');
					content = <File {...item} />;
					break;
				};

				case I.ObjectLayout.Image: {
					cn.push('isImage');
					content = <Image {...item} />;
					break;
				};
			};

			return (
				<div id={`item-${item.id}`} className={cn.join(' ')}>
					{canEdit ? <Handle /> : ''}
					<div 
						className="clickable" 
						onClick={() => U.Object.openConfig(item)} 
						onContextMenu={e => this.onMore(e, item)}
					>
						{content}
					</div>
					<div className="buttons">
						<Icon className="more" onClick={e => this.onMore(e, item)} />
					</div>
				</div>
			);
		});

		const List = SortableContainer(() => (
			<div className="items">
				{items.map((item: any, i: number) => <Item key={i} {...item} index={i} />)}
			</div>
		));

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				{items.length ? (
					<List 
						axis="y" 
						lockAxis="y"
						lockToContainerEdges={true}
						transitionDuration={150}
						distance={10}
						onSortStart={this.onSortStart}
						onSortEnd={this.onSortEnd}
						useDragHandle={true}
						helperClass="isDragging"
						helperContainer={() => $(`#${getId()} .items`).get(0)}
					/>
				) : <EmptySearch />}

				{canEdit ? (
					<div className="bottom">
						<div className="line" />
						<MenuItemVertical 
							id="add" 
							icon="plus" 
							name={translate('commonAdd')} 
							onClick={this.onAdd}
							onMouseEnter={() => setHover({ id: 'add' })}
							onMouseLeave={() => setHover()}
						/>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;

		S.Menu.closeAll([ 'dataviewFileList' ]);
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param, id } = this.props;
		const { data } = param;
		const value = arrayMove(Relation.getArrayValue(data.value), oldIndex, newIndex);

		S.Menu.updateData(id, { value });
		this.save(value);

		keyboard.disableSelection(false);
	};

	onAdd (e: any) {
		const { getId, getSize, param } = this.props;
		const { data } = param;
		const { classNameWrap } = param;

		S.Menu.open('dataviewFileList', {
			element: `#${getId()}`,
			className: 'single',
			offsetX: param.width,
			offsetY: () => -getSize().height,
			classNameWrap: classNameWrap,
			passThrough: true,
			noFlipY: true,
			noAnimation: true,
			data: {
				...data,
				noClose: true,
				placeholderFocus: translate('menuDataviewFileValuesFindAFile'),
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() }
				],
				onChange: (value: string[], callBack?: () => void) => {
					this.save(value);

					if (callBack) {
						callBack();
					};
				},
			}
		});
	};
	
	add (objectId: string) {
		const { param } = this.props;
		const { data } = param;

		this.save(Relation.getArrayValue(data.value).concat([ objectId ]));
	};	

	save (value: string[]) {
		const { param, id } = this.props;
		const { data } = param;
		const { onChange } = data;

		onChange(U.Common.arrayUnique(value), () => S.Menu.updateData(id, { value }));
	};

	onMore (e: any, item: any) {
		const { getId, param, id, position } = this.props;
		const { data, classNameWrap } = param;
		const { onChange } = data;
		const itemEl = $(`#${getId()} #item-${item.id}`);
		const element = `#${getId()} #item-${item.id} .icon.more`;
		const isAllowed = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);

		let value = Relation.getArrayValue(data.value);
		let options: any[] = [
			{ id: 'open', icon: 'expand', name: translate('commonOpen') },
			{ id: 'download', icon: 'download', name: translate('commonDownload') },
		];

		if (isAllowed) {
			options = options.concat([
				{ isDiv: true },
				{ id: 'remove', icon: 'remove', name: translate('commonDelete') },
			]);
		};

		S.Menu.open('select', { 
			element,
			horizontal: I.MenuDirection.Center,
			classNameWrap: classNameWrap,
			onOpen: () => {
				itemEl.addClass('active');
				$(element).addClass('active');
			},
			onClose: () => {
				itemEl.removeClass('active');
				$(element).removeClass('active');
			},
			data: {
				value: '',
				options,
				onSelect: (event: any, el: any) => {

					switch (el.id) {
						case 'open': {
							U.Object.openConfig(item);
							break;
						};
						case 'download': {
							let url = '';
							switch (item.layout) {
								default: {
									url = S.Common.fileUrl(item.id);
									break;
								};

								case I.ObjectLayout.Image: {
									url = S.Common.imageUrl(item.id, J.Size.image);
									break;
								};
							};

							if (url) {
								Renderer.send('download', url, { saveAs: true });
							};
							break;
						};

						case 'remove': {
							value = value.filter(it => it != item.id);
							value = U.Common.arrayUnique(value);

							onChange(value, () => {
								S.Menu.updateData(id, { value });
								S.Menu.updateData(MENU_ID, { value });
								position();
							});
							break;
						};
					};
				},
			}
		});
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { subId } = data;

		return Relation.getArrayValue(data.value).
			map(it => S.Detail.get(subId, it, [])).
			filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted);
	};

});

export default MenuDataviewFileValues;