import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, IconObject, MenuItemVertical } from 'Component';
import { I, C, UtilCommon, UtilFile, UtilObject, Relation, Renderer, keyboard, Action, translate } from 'Lib';
import { commonStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const MENU_ID = 'dataviewFileList';

const MenuDataviewFileValues = observer(class MenuDataviewFileValues extends React.Component<I.Menu> {

	_isMounted = false;
	node: any = null;

	constructor (props: I.Menu) {
		super(props);

		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onUpload = this.onUpload.bind(this);
	};

	render () {
		const { param, position, getId } = this.props;
		const { data } = param;
		const { subId } = data;
		
		let value: any[] = Relation.getArrayValue(data.value);
		value = value.map(it => detailStore.get(subId, it, []));
		value = value.filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted);

        const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const File = (item: any) => (
			<React.Fragment>
				<IconObject object={item} />
				<div className="name">{UtilFile.name(item)}</div>
			</React.Fragment>
		);

		const Image = (item: any) => (
			<img src={commonStore.imageUrl(item.id, 208)} className="img" onLoad={() => position()} />
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
				<div id={'item-' + item.id} className={cn.join(' ')}>
					<Handle />
					<div className="clickable" onClick={() => UtilObject.openPopup(item)} onContextMenu={e => this.onMore(e, item)}>
						{content}
					</div>
					<div className="buttons">
						<Icon className="more" onClick={e => this.onMore(e, item)} />
					</div>
				</div>
			);
		});

        const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{value.map((item: any, i: number) => (
						<Item key={i} {...item} index={i} />
					))}
				</div>
			);
		});

		return (
			<div 
				ref={node => this.node = node}
				className="items"
			>
				{value.length ? (
					<div className="section">
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
					</div>
				) : ''}

				<div className="section">
					<MenuItemVertical id="add" icon="plus" name={translate('commonAdd')} onClick={this.onAdd} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;

		menuStore.closeAll([ 'dataviewFileList' ]);
    };

	onSortStart () {
		keyboard.disableSelection(true);
	};
    
    onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param, id } = this.props;
		const { data } = param;
		
		let value = Relation.getArrayValue(data.value);
		value = arrayMove(value, oldIndex, newIndex);

		menuStore.updateData(id, { value });
		this.save(value);

		keyboard.disableSelection(false);
    };

	onAdd (e: any) {
		const { getId, getSize, close, param, id } = this.props;
		const { data } = param;
		const { classNameWrap } = param;

		menuStore.open('dataviewFileList', {
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
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getFileLayouts() }
				],
				onChange: (value: string[], callBack?: () => void) => {
					this.save(value);

					if (callBack) {
						callBack();
					};
				},
				onUpload: (id: string, callBack?: () => void) => {
					this.add(id);

					if (callBack) {
						callBack();
					};
				}
			}
		});
	};
	
	onUpload (e: any) {
		Action.openFile([], paths => {
			C.FileUpload(commonStore.space, '', paths[0], I.FileType.None, {}, (message: any) => {
				if (!message.error.code) {
					this.add(message.objectId);
				};
			});
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

		onChange(UtilCommon.arrayUnique(value), () => {
			menuStore.updateData(id, { value });
		});
	};

	onMore (e: any, item: any) {
		const { getId, param, id, position } = this.props;
		const { data, classNameWrap } = param;
		const { onChange } = data;
		const element = $(`#${getId()} #item-${item.id}`);

		let value = Relation.getArrayValue(data.value);

		element.addClass('active');
		menuStore.open('select', { 
			element,
			horizontal: I.MenuDirection.Center,
			classNameWrap: classNameWrap,
			onClose: () => {
				element.removeClass('active');
			},
			data: {
				value: '',
				options: [
					{ id: 'open', icon: 'expand', name: translate('commonOpen') },
					{ id: 'download', icon: 'download', name: translate('commonDownload') },
					{ isDiv: true },
					{ id: 'remove', icon: 'remove', name: translate('commonDelete') },
				],
				onSelect: (event: any, el: any) => {

					switch (el.id) {
						case 'open': {
							UtilObject.openPopup(item);
							break;
						};
						case 'download': {
							let url = '';
							switch (item.layout) {
								default: {
									url = commonStore.fileUrl(item.id);
									break;
								};

								case I.ObjectLayout.Image: {
									url = commonStore.imageUrl(item.id, Constant.size.image);
									break;
								};
							};

							if (url) {
								Renderer.send('download', url);
							};
							break;
						};

						case 'remove': {
							value = value.filter(it => it != item.id);
							value = UtilCommon.arrayUnique(value);

							onChange(value, () => {
								menuStore.updateData(id, { value });
								menuStore.updateData(MENU_ID, { value });
								position();
							});
							break;
						};
					};
				},
			}
		});
	};

});

export default MenuDataviewFileValues;
