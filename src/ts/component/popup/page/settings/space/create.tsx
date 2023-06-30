import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, IconObject, Button, Select } from 'Component';
import { UtilObject, UtilCommon, I, C, translate, keyboard } from 'Lib';
import { menuStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	name: string;
	iconEmoji: string;
	iconOption: number;
	iconImage: string;
};

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PopupSettings, State> {

	refName: any = null;

	state = {
		name: '',
		iconEmoji: '',
		iconOption: UtilCommon.rand(1, Constant.iconCnt),
		iconImage: '',
	};

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onName = this.onName.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { name, iconOption, iconEmoji, iconImage } = this.state;
		const space = {
			layout: I.ObjectLayout.Space,
			name,
			iconOption,
			iconEmoji,
			iconImage,
		};

		return (
			<React.Fragment>

				<Title text="Create a space" />

				<div className="spaceHeader">
					<div className="iconWrapper">
						<IconObject
							id="spaceIcon"
							size={96}
							object={space}
							forceLetter={true}
							canEdit={true}
							menuParam={{ horizontal: I.MenuDirection.Center }}
							onSelect={this.onSelect}
							onUpload={this.onUpload}
						/>
					</div>

					<div className="headerContent">
						<div className="name">
							<Label className="small" text={translate('popupSettingsSpaceIndexSpaceNameLabel')} />
							<Input
								ref={ref => this.refName = ref}
								value=""
								onKeyUp={this.onName}
								placeholder={UtilObject.defaultName('Page')}
							/>
						</div>

						<Label
							className="spaceType"
							text={translate('popupSettingsSpaceIndexSpaceTypePersonal')}
						/>
					</div>
				</div>

				<div className="sections">
					<div className="section">
						<div className="sectionContent">
							<div className="item">
								<div className="sides">
									<div className="side left">
										<Title text="How do you want to start?" />
										<Label text="We can load some objects for you" />
									</div>
									<div className="side right">
										<Select 
											id="select-usecase"
											value=""
											options={[]}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="buttons">
					<Button text="Create" onClick={this.onSubmit} />
				</div>

			</React.Fragment>
		);
	};

	componentWillUnmount(): void {
		menuStore.closeAll([ 'select', 'searchObject' ]);	
	};

	onSelect (iconEmoji: string) {
		this.setState({ iconEmoji, iconImage: '' });
	};

	onUpload (iconImage: string) {
		this.setState({ iconEmoji: '', iconImage });
	};

	onName (e: any, v: string) {
		let ret = false;
		
		keyboard.shortcut('enter', e, () => {
			this.onSubmit();
			ret = true;
		});

		if (!ret) {
			this.setState({ name: this.checkName(v) });
		};
	};

	onSubmit () {
		const { close } = this.props;

		C.WorkspaceCreate(this.state.name, (message: any) => {
			console.log(message.objectId);

			close();
		});
	};

	checkName (v: string): string {
		if ([ UtilObject.defaultName('Space'), UtilObject.defaultName('Page') ].includes(v)) {
			v = '';
		};
		return v;
	};

});

export default PopupSettingsSpaceIndex;