import * as React from 'react';
import { Title, Icon, Label, Button, Textarea, ObjectName, IconObject } from 'Component';
import { I, translate, UtilCommon, UtilObject } from 'Lib';
import { observer } from 'mobx-react';
import { authStore, dbStore, detailStore } from 'Store';

const PopupSpaceJoinRequest = observer(class PopupSpaceJoinRequest extends React.Component<I.Popup> {

	message: string = '';

	constructor (props: I.Popup) {
		super(props);

		this.onRequest = this.onRequest.bind(this);
	};

	render() {
		const space = UtilObject.getSpaceview();
		const owner = { name: 'Owner Name', layout: I.ObjectLayout.Human }; // mock, to be replaced with space owner

		const Profile = (item: any) => {
			return (
				<div className="profileItem">
					<IconObject object={item} size={16} />
					<ObjectName object={item} />
				</div>
			);
		};

		return (
			<React.Fragment>
				<Title text={translate('popupSpaceJoinRequestTitle')} />
				<div className="iconWrapper"><Icon /></div>
				<div className="invitation">
					{translate('popupSpaceJoinRequestTextPart1')}
					<Profile {...space} />
					{translate('popupSpaceJoinRequestTextPart2')}
					<Profile {...owner} />
					{translate('popupSpaceJoinRequestTextPart3')}
				</div>

				<Textarea onKeyUp={(e, v) => this.message = v} placeholder={translate('popupSpaceJoinRequestMessagePlaceholder')} />

				<div className="buttons">
					<Button onClick={this.onRequest} text={translate('popupSpaceJoinRequestRequestToJoin')} className="c36" />
				</div>
				<div className="note">{translate('popupSpaceJoinRequestNote')}</div>
			</React.Fragment>
		);
	};

	onRequest () {
		console.log('MESSAGE: ', this.message)
	};
});

export default PopupSpaceJoinRequest;
