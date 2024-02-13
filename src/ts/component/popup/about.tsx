import * as React from 'react';
import { Title, Icon, Label, Button } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';

const PopupAbout = observer(class PopupAbout extends React.Component<I.Popup> {

	render() {
		return (
			<React.Fragment>
				<div className="iconWrapper">
					<Icon />
				</div>
				<Title text={translate('popupAboutTitle')} />
				<Label text={translate('popupAboutDescription')} />

				<div className="version">
					{UtilCommon.sprintf(translate('popupAboutVersion'), window.Electron.version.app)}
					<Button onClick={this.onVersionCopy} text={translate('commonCopy')} className="c28" color="blank" />
				</div>
				<div className="copyright">{translate('popupAboutCopyright')}</div>
			</React.Fragment>
		);
	};

	onVersionCopy () {
		UtilCommon.clipboardCopy({ text: window.Electron.version.app });
	};
});

export default PopupAbout;
