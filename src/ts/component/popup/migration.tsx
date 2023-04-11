import * as React from 'react';
import $ from 'jquery';
import { Title, Label, Button, Textarea } from 'Component';
import { I, Util, Preview, Action, Renderer, C, translate, analytics } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';
import Url from 'json/url.json';

interface State {
	step: number;
};

const PopupMigration = observer(class PopupMigration extends React.Component<I.Popup, State> {

	state = {
		step: 0,
	};
	node = null;
	refPhrase = null;

	constructor (props: I.Popup) {
		super(props);
		
		this.onExport = this.onExport.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCopy = this.onCopy.bind(this);
	};

	render () {
		const { close } = this.props;
		const { step } = this.state;

		let content = null;
		let buttons: any[] = [];

		switch (step) {
			case 0: {
				content = (
					<React.Fragment>
						<Title text="⚡️ Get excited...<br/>the new Anytype awaits you!" />
						<div className="labels">
							<Label text="We're pleased to bring you a completely revamped data layer, widgets, spaces, collections and more. With it, you'll enjoy a faster and more reliable version of Anytype." />
							<Label text="To join us there, follow the instructions to migrate your account - it will only take a few minutes." />

							<ol>
								<li>Sync your account on all devices</li>
								<li>Export your data</li>
								<li>Download the new app</li>
								<li>Import your files</li>
							</ol>
						</div>
					</React.Fragment>
				);

				buttons = buttons.concat([
					{ text: 'Get started', color: 'black', onClick: () => this.setState({ step: 1 }) },
					{ text: 'Later', color: 'blank', onClick: close },
				]);
				break;
			};

			case 1: {
				content = (
					<React.Fragment>
						<Label className="bold" text="Step 1: Sync" />
						<Label text="Connect your desktop & mobile devices to the same wifi network while signed into Anytype." />

						<Label className="bold" text="Step 2: Export" />
						<Label text="Export and back up your files. This will create a zip archive that you'll need later (don't forget the directory!) Please wait until the process is completed before proceeding." />
					</React.Fragment>
				);

				buttons = buttons.concat([
					{ text: 'Begin export', color: 'black', onClick: () => this.onExport() },
					{ text: 'Later', color: 'blank', onClick: close },
				]);
				break;
			};

			case 2: {
				content = (
					<React.Fragment>
						<Label className="bold" text="Step 3: Download" />
						<Label className="c12" text="Your files are all backed up and you're ready to download the new app!<br/><b>Please make sure you have your recovery phrase handy.</b>" />

						<div className="inputs">
							<div className="textareaWrap">
								<Textarea 
									ref={(ref: any) => this.refPhrase = ref} 
									id="phrase" 
									value={translate('popupSettingsPhraseStub')} 
									className="isBlurred"
									onFocus={this.onFocus} 
									onBlur={this.onBlur} 
									onCopy={this.onCopy}
									placeholder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" 
									readonly={true} 
								/>
							</div>
							<Button id="button-phrase" color="blank" className="c28" text={translate('popupSettingsPhraseShowPhrase')} onClick={this.onCopy} />
						</div>

						<Label text="Now, click the button to close the current application and open the link to download the new version. In case of anything, the current app will still be available." />

					</React.Fragment>
				);

				buttons = buttons.concat([
					{ text: 'Close and Download', color: 'black', onClick: () => this.onClose() },
				]);
				break;
			};
		};

		return (
			<div ref={ref => this.node = ref}>
				{content}

				<div className="buttons">
					{buttons.map((item: any, i: number) => (
						<Button key={i} {...item} className="c36" />
					))}
				</div>
			</div>
		);
	};

	componentDidUpdate (): void {
		this.props.position();	
	};

	onExport () {
		Action.openDir(paths => {
			C.ObjectListExport(paths[0], [], I.ExportFormat.Protobuf, true, true, true, true, true, (message: any) => {
				if (!message.error.code) {
					Renderer.send('pathOpen', paths[0]);

					this.setState({ step: 2 });
				};
			});
		});
	};

	onFocus () {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();

		phrase.removeClass('isBlurred');
	};

	onBlur () {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(translate('popupSettingsPhraseStub'));

		phrase.addClass('isBlurred');
		window.getSelection().removeAllRanges();
	};

	onCopy (e: any) {
		this.refPhrase.focus();

		Util.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: 'Recovery phrase copied to clipboard' });

		analytics.event('KeychainCopy', { type: 'Migration' });
	};

	onClose () {
		Renderer.send('urlOpen', Url.migration);
		Renderer.send('exit');
	};

});

export default PopupMigration;