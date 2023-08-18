import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Title, Label, Input, IconObject, Button, Select, Loader } from 'Component';
import { UtilObject, UtilCommon, UtilRouter, I, C, translate, keyboard } from 'Lib';
import { menuStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	name: string;
	iconEmoji: string;
	iconOption: number;
	iconImage: string;
	useCase: I.Usecase;
	isLoading: boolean;
};

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PopupSettings, State> {

	refName: any = null;

	state = {
		name: '',
		iconEmoji: '',
		iconOption: UtilCommon.rand(1, Constant.iconCnt),
		iconImage: '',
		useCase: 0,
		isLoading: false,
	};

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onName = this.onName.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { name, iconOption, iconEmoji, iconImage, useCase, isLoading } = this.state;
		const space = {
			layout: I.ObjectLayout.Space,
			name,
			iconOption,
			iconEmoji,
			iconImage,
		};
		const options = this.getUsecaseOptions();

		return (
			<React.Fragment>

				{isLoading ? <Loader /> : ''}

				<Title text={translate('popupSettingsSpaceCreateTitle')} />

				<div className="spaceHeader">
					<div className="iconWrapper">
						<IconObject
							id="spaceIcon"
							size={96}
							object={space}
							forceLetter={true}
							canEdit={true}
							noUpload={true}
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
										<Title text={translate('popupSettingsSpaceCreateUsecaseTitle')} />
										<Label text={translate('popupSettingsSpaceCreateUsecaseLabel')} />
									</div>
									<div className="side right">
										<Select 
											id="select-usecase"
											value={String(useCase || '')}
											options={options}
											onChange={id => this.setState({ useCase: Number(id) || 0 })}
											menuParam={{
												width: 360,
												horizontal: I.MenuDirection.Center,
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="buttons">
					<Button text={translate('commonCreate')} onClick={this.onSubmit} />
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
		const { isLoading } = this.state;

		if (isLoading) {
			return;
		};

		this.setState({ isLoading: true });

		C.WorkspaceCreate(this.state,  this.state.useCase, (message: any) => {
			this.setState({ isLoading: false });
			UtilRouter.switchSpace(message.objectId);
			close();
		});
	};

	checkName (v: string): string {
		if ([ UtilObject.defaultName('Space'), UtilObject.defaultName('Page') ].includes(v)) {
			v = '';
		};
		return v;
	};

	getUsecaseOptions () {
		return [
			{ id: I.Usecase.None }
		].concat(_.shuffle([
			{ id: I.Usecase.Personal },
			{ id: I.Usecase.Notes },
			{ id: I.Usecase.Knowledge },
        ])).map(it => ({
			...it,
			name: translate(`usecase${it.id}Title`),
			description: translate(`usecase${it.id}Label`),
			withDescription: true,
		}));
	};

});

export default PopupSettingsSpaceIndex;