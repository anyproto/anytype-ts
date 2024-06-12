import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Title, Label, Input, IconObject, Button, Select, Loader, Error } from 'Component';
import { UtilObject, UtilCommon, I, C, translate, keyboard, Preview, analytics } from 'Lib';
import { menuStore } from 'Store';
const Constant = require('json/constant.json');

interface State {
	error: string;
	isLoading: boolean;
	iconOption: number;
	usecase: I.Usecase;
};

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PopupSettings, State> {

	refName: any = null;

	state = {
		error: '',
		isLoading: false,
		iconOption: UtilCommon.rand(1, Constant.iconCnt),
		usecase: I.Usecase.Empty,
	};

	constructor (props: any) {
		super(props);

		this.onKeyDown = this.onKeyDown.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onSelectUsecase = this.onSelectUsecase.bind(this);
	};

	render () {
		const { error, iconOption, usecase, isLoading } = this.state;
		const { onSpaceTypeTooltip } = this.props;
		const space = {
			layout: I.ObjectLayout.SpaceView,
			iconOption,
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
							canEdit={false}
							menuParam={{ horizontal: I.MenuDirection.Center }}
						/>
					</div>

					<div className="headerContent">
						<div className="name">
							<Input
								ref={ref => this.refName = ref}
								value=""
								onKeyDown={this.onKeyDown}
								placeholder={translate('defaultNamePage')}
							/>
						</div>
						<div className="info">
							<Label
								className="infoLabel spaceAccessType"
								text={translate(`spaceAccessType${I.SpaceType.Private}`)}
							/>
							<div className="bullet" />
							<Label 
								className="infoLabel withTooltip"
								text={translate('popupSettingsSpaceIndexInfoLabel')} 
								onMouseEnter={onSpaceTypeTooltip}
								onMouseLeave={e => Preview.tooltipHide(false)}
							/>
						</div>
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
											value={String(usecase || '')}
											options={options}
											onChange={this.onSelectUsecase}
											menuParam={{
												width: 360,
												horizontal: I.MenuDirection.Center,
												className: 'withFullDescripion',
												data: { noVirtualisation: true, noScroll: true }
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
					<Error text={error} />
				</div>

			</React.Fragment>
		);
	};

	componentDidMount (): void {
		this.onSelectUsecase(I.Usecase.Empty);

		window.setTimeout(() => this.refName?.focus(), 15);
	};

	componentWillUnmount(): void {
		menuStore.closeAll([ 'select', 'searchObject' ]);	
	};

	onKeyDown (e: any, v: string) {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			this.onSubmit();
		});
	};

	checkName (v: string): string {
		if ([
			translate('defaultNameSpace'), 
			translate('defaultNamePage'),
		].includes(v)) {
			v = '';
		};
		return v;
	};

	getUsecaseOptions (): any[] {
		let ret: any = [ 
			{ id: I.Usecase.Empty, icon: 'white_medium_square' },
		];

		ret = ret.concat(_.shuffle([
			{ id: I.Usecase.Personal, icon: 'postbox', },
			{ id: I.Usecase.Notes, icon: 'memo' },
			{ id: I.Usecase.Knowledge, icon: 'books' },
			{ id: I.Usecase.Strategic, icon: 'bulb' },
        ]));

		return ret.map((it: any) => ({
			...it,
			name: translate(`usecase${it.id}Title`),
			description: translate(`usecase${it.id}Label`),
			withDescription: true,
			iconSize: 40,
			object: { iconEmoji: `:${it.icon}:` }
		}));
	};

	onSelectUsecase (id: any) {
		const usecase = Number(id) || I.Usecase.Empty;
		const item = this.getUsecase(usecase);

		this.setState({ usecase });

		if (item) {
			this.refName.setPlaceholder(item.name);
		};
	};

	getUsecase (id: I.Usecase) {
		return this.getUsecaseOptions().find(it => it.id == id);
	};

	onSubmit () {
		const { close, param } = this.props;
		const { isLoading, usecase, iconOption } = this.state;
		const { data } = param;
		const { onCreate } = data;

		if (isLoading) {
			return;
		};

		this.setState({ isLoading: true });

		let name = this.checkName(this.refName.getValue());
		if (!name) {
			const item = this.getUsecase(usecase);

			if (item) {
				name = item.name;
			};
		};

		C.WorkspaceCreate({ name, iconOption }, usecase, (message: any) => {
			this.setState({ isLoading: false });

			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			if (onCreate) {
				onCreate(message.objectId);
			};

			analytics.event('CreateSpace', { usecase, middleTime: message.middleTime, route: analytics.route.navigation });
			analytics.event('SelectUsecase', { type: usecase });
		});
	};

});

export default PopupSettingsSpaceIndex;