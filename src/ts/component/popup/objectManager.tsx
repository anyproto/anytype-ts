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
		const { param, getId } = this.props;
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
			<React.Fragment>
				<Title text={title} />

				<ListObjectManager
					ref={ref => this.refManager = ref}
					subId={subId}
					rowLength={2}
					withArchived={true}
					buttons={[]}
					iconSize={48}
					collectionId={collectionId}
					textEmpty={translate('popupSettingsSpaceStorageManagerEmptyLabel')}
					onAfterLoad={this.onAfterLoad}
				/>

				<Button text={button} className="c36" onClick={this.onClick} />
			</React.Fragment>
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
				C.ObjectListSetIsFavorite(this.refManager.selected, true);
				break;
			};
		};

		this.props.close();
	};

	onAfterLoad (message) {
		const { param } = this.props;
		const { data } = param;
		const { type } = data;

		switch (type) {
			case I.ObjectManagerPopup.Favorites: {
				if (message.records && message.records.length <= 8) {
					this.refManager?.setSelectedRange(0, 8);
				};
				break;
			};
		};
	};
	
});

export default PopupObjectManager;
