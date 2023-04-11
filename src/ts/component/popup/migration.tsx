import * as React from 'react';
import { Title, Label, Button } from 'Component';
import { I} from 'Lib';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';
import QRCode from 'qrcode.react';
import Url from 'json/url.json';

interface State {
	step: number;
};

const fgColor = {
	'': '#000',
	dark: '#fff',
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
		const { close } = this.props;
		const { theme } = commonStore;

		return (
			<div ref={ref => this.node = ref}>
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
			</div>
		);
	};

	componentDidUpdate (): void {
		this.props.position();	
	};

});

export default PopupMigration;