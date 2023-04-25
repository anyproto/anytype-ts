import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, Onboarding } from 'Lib';
import { commonStore } from 'Store';
import QRCode from 'qrcode.react';
import Url from 'json/url.json';

interface State {
	step: number;
};

const fgColor = {
	'': '#000',
	dark: '#d4d4d4',
};

const bgColor = {
	'': '#f2f2f2',
	dark: '#252525',
};

const PopupMigration = observer(class PopupMigration extends React.Component<I.Popup, State> {

	state = {
		step: 0,
	};
	node = null;

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { type } = data;
		const theme = commonStore.getThemeClass();

		let content = null;

		switch (type) {
			case 'onboarding': {
				content = (
					<React.Fragment>
						<Title text="⚡️ Congratulations!" />
						<Label text="You're now using the new & improved version of Anytype.<br/>It's still encrypted, offline-first and the safest app for your personal information." />
						<Label text="The updated version of Anytype on iOS and Android is also available for download! If you haven't already, please scan this QR code to update your devices:" />

						<div className="qrWrap">
							<QRCode value={Url.download} fgColor={fgColor[theme]} bgColor={bgColor[theme]} size={100} />
						</div>

						<Label text={`We're excited to hear your feedback about the new features.`} />

						<div className="buttons">
							<Button text="Done" className="c36" onClick={close} />
						</div>
					</React.Fragment>
				);
				break;
			};

			case 'import': {
				content = (
					<React.Fragment>
						<Title text="You're all set!" />
						<Label text="Please take a few moments to check that your data has been imported correctly." />
						<Label text="One last thing. The updated version of Anytype on iOS and Android is also available for download! If you haven't already, please scan this QR code to update your devices:" />

						<div className="qrWrap">
							<QRCode value={Url.download} fgColor={fgColor[theme]} bgColor={bgColor[theme]} size={100} />
						</div>

						<Label text={`In case of any issues, you can repeat the migration process using the legacy desktop app or visit our <a href="${Url.community}">community forum</a>.`} />

						<div className="buttons">
							<Button text="Done" className="c36" onClick={close} />
						</div>
					</React.Fragment>
				);
				break;
			};
		};

		return (
			<div ref={ref => this.node = ref}>
				{content}
			</div>
		);
	};

	componentWillUnmount(): void {
		const { param } = this.props;
		const { data } = param;
		const { type } = data;

		if (type == 'onboarding') {
			Onboarding.start('dashboard', false, true);
		};
	};

});

export default PopupMigration;