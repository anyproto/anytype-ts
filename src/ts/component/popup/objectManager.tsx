import React, { forwardRef, useEffect, useRef } from 'react';
import $ from 'jquery';
import { Title, Label, Button, ListObjectManager, IconObject } from 'Component';
import { I, J, keyboard, translate, U } from 'Lib';
import { observer } from 'mobx-react';

const ROW_HEIGHT = 30;

const PopupObjectManager = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, getId, close, position } = props;
	const { data } = param;
	const { type, objects, keys, onConfirm } = data;
	const subId = [ getId(), 'data' ].join('-');
	const managerRef = useRef(null);

	const rebind = () => {
		unbind();
		$(window).on('keydown.confirm', e => onKeyDown(e));
	};

	const unbind = () => {
		$(window).off('keydown.confirm');
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('enter', e, () => {
			e.stopPropagation();
			onClick(e);
		});
	};
	
	const onClick = (e: any) => {
		e.preventDefault();

		onConfirm?.(managerRef.current.getSelected(), managerRef.current.getItemsCount());
		close();
	};

	const onUpdate = () => {
		window.setTimeout(() => {
			const wrap = $(`#${getId()}-innerWrap`);
			const items = wrap.find('.items');
			const height = wrap.outerHeight() - items.outerHeight() || 0;
			const l = managerRef.current.getItemsCount();

			if (l) {
				wrap.css({ height: height + l * ROW_HEIGHT });
			};

			position();
		}, 5);
	};

	useEffect(() => {
		keyboard.setFocus(true);
		rebind();

		return () => {
			keyboard.setFocus(false);
			unbind();
		};
	}, []);

	let ignoreArchived = false;
	let textEmpty = translate('popupSettingsSpaceStorageEmptyLabel');
	let icon: any = null;
	let title = '';
	let label = '';
	let button = translate('commonDone');
	let buttonColor = 'black';
	let rowLength = 2;
	let filters = [];

	switch (type) {
		case I.ObjectManagerPopup.Favorites: {
			title = translate('popupSettingsImportFavouriteTitle');
			button = translate('commonAddToFavorites');
			break;
		};

		case I.ObjectManagerPopup.TypeArchive: {
			if (objects.length == 1) {
				const { name, pluralName } = objects[0];

				icon = <IconObject size={56} iconSize={56} object={objects[0]} />;
				title = U.String.sprintf(translate('popupObjectManagerArchiveTypeTitle'), pluralName ? pluralName : name);
				label = translate('popupObjectManagerArchiveTypeText');
			} else {
				title = U.String.sprintf(translate('popupObjectManagerArchiveTypeTitlePlural'), objects.length);
				label = translate('popupObjectManagerArchiveTypeTextPlural');
			};

			ignoreArchived = true;
			textEmpty = translate('popupObjectManagerArchiveTypeEmptyText');
			button = translate('commonMoveToBin');
			buttonColor = 'red';
			rowLength = 1;
			filters = [
				{ relationKey: 'type', condition: I.FilterCondition.In, value: objects.map(({ id }) => id) }
			];
		};
	};

	return (
		<>
			<div className="textWrapper">
				{icon}
				<Title text={title} />
				{label ? <Label text={label} /> : ''}
			</div>

			<ListObjectManager
				ref={managerRef}
				subId={subId}
				ignoreArchived={ignoreArchived}
				buttons={[]}
				filters={filters}
				keys={keys || J.Relation.default}
				textEmpty={textEmpty}
				onUpdate={onUpdate}
				disableHeight={false}
				isCompact={true}
				scrollElement={$(`#${getId()}-innerWrap .items`).get(0)}
			/>

			<div className="buttons">
				<Button text={button} color={buttonColor} className="c36" onClick={onClick} />
				<Button text={translate('commonCancel')} color="blank" className="c36" onClick={() => close()} />
			</div>
		</>
	);

}));

export default PopupObjectManager;
