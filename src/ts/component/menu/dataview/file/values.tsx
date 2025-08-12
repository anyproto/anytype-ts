import React, { forwardRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, IconObject, MenuItemVertical, EmptySearch, ObjectName } from 'Component';
import { I, S, U, J, Relation, Renderer, keyboard, translate } from 'Lib';

const MENU_ID = 'dataviewFileList';

const MenuDataviewFileValues = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, param, position, getId, getSize, setHover } = props;
	const { data, classNameWrap } = param;
	const { canEdit, onChange, subId } = data;
	const value = Relation.getArrayValue(data.value);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const onSortStart = () => {
		keyboard.disableSelection(true);
	};
	
	const onSortEnd = (result: any) => {
		const { active, over } = result;
		if (!active || !over) {
			return;
		};

		const oldIndex = value.indexOf(active.id);
		const newIndex = value.indexOf(over.id);
		const newValue = arrayMove(value, oldIndex, newIndex);

		S.Menu.updateData(id, { value: newValue });
		save(newValue);

		keyboard.disableSelection(false);
	};

	const onAdd = (e: any) => {
		const { width, height } = getSize();

		S.Menu.open('dataviewFileList', {
			element: `#${getId()}`,
			className: 'single',
			offsetX: param.width || width,
			offsetY: () => -height,
			classNameWrap,
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
					save(value);

					if (callBack) {
						callBack();
					};
				},
			}
		});
	};
	
	const save = (value: string[]) => {
		if (onChange) {
			onChange(U.Common.arrayUnique(value), () => S.Menu.updateData(id, { value }));
		};
	};

	const onMore = (e: any, item: any) => {
		const itemEl = $(`#${getId()} #item-${item.id}`);
		const element = `#${getId()} #item-${item.id} .icon.more`;
		const isAllowed = canEdit && S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);

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
									url = S.Common.imageUrl(item.id, I.ImageSize.Large);
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

	const getItems = () => {
		return Relation.getArrayValue(data.value).
			map(it => S.Detail.get(subId, it, [])).
			filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted);
	};
	
	const File = (item: any) => (
		<>
			<IconObject object={item} />
			<ObjectName object={item} />
		</>
	);

	const Image = (item: any) => (
		<img src={S.Common.imageUrl(item.id, I.ImageSize.Medium)} className="img" onLoad={() => position()} />
	);

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: !canEdit });

		if (transform) {
			transform.scaleX = 1;
			transform.scaleY = 1;
		};

		const style = {
			...item.style,
			transform: CSS.Transform.toString(transform),
			transition,
		};
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
			<div 
				id={`item-${item.id}`} 
				className={cn.join(' ')}
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
			>
				{canEdit ? <Icon className="dnd" /> : ''}
				<div 
					className="clickable" 
					onClick={() => U.Object.openConfig(item)} 
					onContextMenu={e => onMore(e, item)}
				>
					{content}
				</div>
				<div className="buttons">
					<Icon className="more" onClick={e => onMore(e, item)} />
				</div>
			</div>
		);
	};

	const items = getItems();

	useEffect(() => {
		return () => {
			S.Menu.closeAll([ 'dataviewFileList' ]);
		};
	}, []);

	return (
		<div className="wrap">
			{items.length ? (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={onSortStart}
					onDragEnd={onSortEnd}
					modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]}
				>
					<SortableContext
						items={items.map((item) => item.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="items">
							{items.map((item: any, i: number) => <Item key={i} {...item} index={i} />)}
						</div>
					</SortableContext>
				</DndContext>
			) : <EmptySearch />}

			{canEdit ? (
				<div className="bottom">
					<div className="line" />
					<MenuItemVertical 
						id="add" 
						icon="plus" 
						name={translate('commonAdd')} 
						onClick={onAdd}
						onMouseEnter={() => setHover({ id: 'add' })}
						onMouseLeave={() => setHover()}
					/>
				</div>
			) : ''}
		</div>
	);

}));

export default MenuDataviewFileValues;