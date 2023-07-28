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
		value = value.filter(it => !it._empty_);

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
			<img src={commonStore.imageUrl(item.id, 208)} className="img" onLoad={() => { position(); }} />
		);

        const Item = SortableElement((item: any) => {
			let content = null;
			let cn = [ 'item' ];

			switch (item.layout) {
				default:
				case I.ObjectLayout.File: {
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
					<div className="clickable" onClick={(e: any) => { UtilObject.openPopup(item); }}>
						{content}
					</div>
					<div className="buttons">
						<Icon className="more" onClick={(e: any) => { this.onMore(e, item); }} />
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
				<div className="section">
					<MenuItemVertical id="add" icon="plus" name={translate('commonAdd')} onClick={this.onAdd} />
					<MenuItemVertical id="upload" icon="upload" name={translate('commonUpload')} onClick={this.onUpload} />
				</div>

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
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: [ I.ObjectLayout.File, I.ObjectLayout.Image ] }
				],
				onChange: (value: string[], callBack?: () => void) => {
					this.save(value);

					if (callBack) {
						callBack();
					};
				}
			}
		});
	};
	
	onUpload (e: any) {
		Action.openFile([], paths => {
			C.FileUpload('', paths[0], I.FileType.None, (message: any) => {
				if (!message.error.code) {
					this.add(message.hash);
				};
			});
		});
	};

	add (hash: string) {
		const { param } = this.props;
		const { data } = param;

		let value = Relation.getArrayValue(data.value);
		value.push(hash);
		value = UtilCommon.arrayUnique(value);

		this.save(value);
	};	

	save (value: string[]) {
		const { param, id } = this.props;
		const { data } = param;
		const { onChange } = data;

		onChange(value, () => {
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
			element: element.find('.icon.more'),
			horizontal: I.MenuDirection.Center,
			classNameWrap: classNameWrap,
			onClose: () => {
				element.removeClass('active');
			},
			data: {
				value: '',
				options: [
					{ id: 'download', icon: 'download', name: translate('commonDownload') },
					{ id: 'remove', icon: 'remove', name: translate('commonDelete') },
				],
				onSelect: (event: any, el: any) => {

					switch (el.id) {
						case 'download': {
							let url = '';
							switch (item.layout) {
								case I.ObjectLayout.File:
									url = commonStore.fileUrl(item.id);
									break;

								case I.ObjectLayout.Image:
									url = commonStore.imageUrl(item.id, Constant.size.image);
									break;
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