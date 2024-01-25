import * as React from 'react';
import { Title, Icon, Label, Button, Textarea, ObjectName, IconObject, Error } from 'Component';
import { I, C, translate, UtilCommon, UtilObject } from 'Lib';
import { observer } from 'mobx-react';
import { authStore, dbStore, detailStore } from 'Store';

interface State {
	error: string;
};

const PopupSpaceJoinRequest = observer(class PopupSpaceJoinRequest extends React.Component<I.Popup, State> {

	refMessage = null;
	state = {
		error: '',
	};
	spaceName = '';
	creatorName = '';

	constructor (props: I.Popup) {
		super(props);

		this.onRequest = this.onRequest.bind(this);
	};

	render() {
		const { error } = this.state;

		return (
			<React.Fragment>
				<Title text={translate('popupSpaceJoinRequestTitle')} />
				
				<div className="iconWrapper">
					<Icon />
				</div>


				<Label className="invitation" text={UtilCommon.sprintf(translate('popupSpaceJoinRequestText'), this.spaceName, this.creatorName)} />
				<Textarea ref={ref => this.refMessage = ref} placeholder={translate('popupSpaceJoinRequestMessagePlaceholder')} />

				<div className="buttons">
					<Button onClick={this.onRequest} text={translate('popupSpaceJoinRequestRequestToJoin')} className="c36" />
				</div>

				<div className="note">{translate('popupSpaceJoinRequestNote')}</div>

				<Error text={error} />
			</React.Fragment>
		);
	};

	componentDidMount (): void {
		const { param } = this.props;
		const { data } = param;
		const { cid, key } = data;

		C.SpaceInviteView(cid, key, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			this.spaceName = message.spaceName;
			this.creatorName = message.creatorName;
			this.forceUpdate();
		});
	};

	onRequest () {
	};
});

export default PopupSpaceJoinRequest;