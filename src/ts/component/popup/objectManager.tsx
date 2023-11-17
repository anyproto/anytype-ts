import * as React from 'react';
import { Title, Button, ListObjectManager } from 'Component';
import { analytics, C, I, keyboard, translate } from 'Lib';
import { observer } from 'mobx-react';

const PopupObjectManage = observer(class PopupObjectManage extends React.Component<I.Popup> {

	refManager = null;

	constructor (props: I.Popup) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param, getId } = this.props;
		const { data } = param;
		const { collectionId, type } = data;
		const subId = [ getId(), 'data' ].join('-');

		let title = '';

		switch (type) {
			case I.ObjectManagerPopup.Favorites: {
				title = translate('popupSettingsImportFavouriteTitle');
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
				/>

				<Button text={translate('commonDone')} onClick={this.onClick} />
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
	
});

export default PopupObjectManage;
