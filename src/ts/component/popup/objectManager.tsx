import * as React from 'react';
import { Title, Button, ListObjectManager } from 'Component';
import { C, I, keyboard, translate } from 'Lib';
import { observer } from 'mobx-react';

const PopupObjectManager = observer(class PopupObjectManager extends React.Component<I.Popup> {

	refManager = null;

	constructor (props: I.Popup) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onAfterLoad = this.onAfterLoad.bind(this);
	};

	render () {
		const { param, getId, close } = this.props;
		const { data } = param;
		const { collectionId, type } = data;
		const subId = [ getId(), 'data' ].join('-');

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
					ref={ref => this.refManager = ref}
					subId={subId}
					rowLength={2}
					ignoreArchived={false}
					buttons={[]}
					iconSize={48}
					collectionId={collectionId}
					textEmpty={translate('popupSettingsSpaceStorageManagerEmptyLabel')}
					onAfterLoad={this.onAfterLoad}
					disableHeight={false}
					scrollElement={$(`#${getId()}-innerWrap .items`).get(0)}
				/>

				<div className="buttons">
					<Button text={button} className="c36" onClick={this.onClick} />
					<Button text={translate('commonCancel')} color="blank" className="c36" onClick={() => close()} />
				</div>
			</>
		);
	};

	componentDidMount() {
		keyboard.setFocus(true);

		this.rebind();
	};

	componentWillUnmount() {
		keyboard.setFocus(false);

		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.confirm', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.confirm');
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter, space', e, (pressed: string) => {
			e.stopPropagation();
			this.onClick(e);
		});
	};
	
	onClick (e: any) {
		e.preventDefault();

		const { param } = this.props;
		const { data } = param;
		const { type } = data;

		switch (type) {
			case I.ObjectManagerPopup.Favorites: {
				C.ObjectListSetIsFavorite(this.refManager.getSelected(), true);
				break;
			};
		};

		this.props.close();
	};

	onAfterLoad (message: any) {
		const { param } = this.props;
		const { data } = param;
		const { type } = data;

		switch (type) {
			case I.ObjectManagerPopup.Favorites: {
				if (message.records && message.records.length) {
					this.refManager?.setSelection(message.records.filter(it => it.isFavorite).map(it => it.id));
				};
				break;
			};
		};
	};
	
});

export default PopupObjectManager;
