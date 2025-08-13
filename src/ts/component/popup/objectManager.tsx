import React, { forwardRef, useEffect, useRef } from 'react';
import { Title, Button, ListObjectManager } from 'Component';
import { C, I, keyboard, translate } from 'Lib';
import { observer } from 'mobx-react';

const PopupObjectManager = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, getId, close } = props;
	const { data } = param;
	const { collectionId, type } = data;
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
		keyboard.shortcut('enter, space', e, (pressed: string) => {
			e.stopPropagation();
			onClick(e);
		});
	};
	
	const onClick = (e: any) => {
		e.preventDefault();

		switch (type) {
			case I.ObjectManagerPopup.Favorites: {
				C.ObjectListSetIsFavorite(managerRef.current?.getSelected(), true);
				break;
			};
		};

		close();
	};

	const onAfterLoad = (message: any) => {
		switch (type) {
			case I.ObjectManagerPopup.Favorites: {
				if (message.records && message.records.length) {
					managerRef.current?.setSelection(message.records.filter(it => it.isFavorite).map(it => it.id));
				};
				break;
			};
		};
	};

	useEffect(() => {
		keyboard.setFocus(true);
		rebind();

		return () => {
			keyboard.setFocus(false);
			unbind();
		};
	}, []);

	let title = '';
	let button = translate('commonDone');

	switch (type) {
		case I.ObjectManagerPopup.Favorites: {
			title = translate('popupSettingsImportFavouriteTitle');
			button = translate('commonAddToFavorites');
			break;
		};
	};

	return (
		<>
			<Title text={title} />

			<ListObjectManager
				ref={managerRef}
				subId={subId}
				rowLength={2}
				ignoreArchived={false}
				buttons={[]}
				iconSize={48}
				collectionId={collectionId}
				textEmpty={translate('popupSettingsSpaceStorageEmptyLabel')}
				onAfterLoad={onAfterLoad}
				disableHeight={false}
				scrollElement={$(`#${getId()}-innerWrap .items`).get(0)}
			/>

			<div className="buttons">
				<Button text={button} className="c36" onClick={onClick} />
				<Button text={translate('commonCancel')} color="blank" className="c36" onClick={() => close()} />
			</div>
		</>
	);

}));

export default PopupObjectManager;