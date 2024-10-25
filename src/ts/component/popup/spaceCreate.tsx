import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Label, Input, IconObject, Button, Loader, Error } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Storage } from 'Lib';

interface State {
	error: string;
	isLoading: boolean;
	iconOption: number;
	usecase: I.Usecase;
};

const PopupSpaceCreate = observer(class PopupSpaceCreate extends React.Component<I.PopupSettings, State> {

	refIcon: any = null;
	refName: any = null;

	state = {
		error: '',
		isLoading: false,
		iconOption: U.Common.rand(1, J.Constant.count.icon),
		usecase: I.Usecase.Empty,
	};

	constructor (props: any) {
		super(props);

		this.onKeyDown = this.onKeyDown.bind(this);
		this.onChange = this.onChange.bind(this);
	};

	render () {
		const { error, iconOption, isLoading } = this.state;
		const space = {
			name: this.refName?.getValue(),
			layout: I.ObjectLayout.SpaceView,
			iconOption,
		};

		return (
			<React.Fragment>

				{isLoading ? <Loader id="loader" /> : ''}

				<Label text={translate('popupSpaceCreateLabel')} />

				<div className="iconWrapper">
					<IconObject
						ref={ref => this.refIcon = ref}
						size={96}
						object={space}
						canEdit={false}
						menuParam={{ horizontal: I.MenuDirection.Center }}
					/>
				</div>

				<div className="nameWrapper">
					<Input
						ref={ref => this.refName = ref}
						value=""
						onKeyDown={this.onKeyDown}
						onChange={this.onChange}
						placeholder={translate('defaultNamePage')}
					/>
				</div>

				<div className="buttons">
					<Button text={translate('popupSpaceCreateCreate')} onClick={() => this.onSubmit(false)} />
					<Button text={translate('popupSpaceCreateImport')} color="blank" onClick={() => this.onSubmit(true)} />
				</div>

				<Error text={error} />

			</React.Fragment>
		);
	};

	componentDidMount (): void {
		window.setTimeout(() => this.refName?.focus(), 15);
	};

	onKeyDown (e: any, v: string) {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			this.onSubmit(false);
		});
	};

	onChange (e: any, v: string) {
		if (this.refIcon) {
			this.refIcon.props.object.name = v;
			this.refIcon.forceUpdate();
		};
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

	onSubmit (withImport: boolean) {
		const { param } = this.props;
		const { isLoading, iconOption } = this.state;
		const { data } = param;
		const { onCreate, route } = data;
		const name = this.checkName(this.refName.getValue());

		if (isLoading) {
			return;
		};

		this.setLoading(true);

		const details = {
			name,
			iconOption,
			spaceDashboardId: I.HomePredefinedId.Last,
		};

		C.WorkspaceCreate(details, I.Usecase.GetStarted, (message: any) => {
			this.setLoading(false);

			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			C.WorkspaceSetInfo(message.objectId, details, () => {
				if (message.error.code) {
					this.setState({ error: message.error.description });
					return;
				};

				const ids = [ message.objectId ].concat(U.Menu.getVaultItems().map(it => it.id));

				Storage.set('spaceOrder', ids, true);

				U.Router.switchSpace(message.objectId, '', true, { 
					onRouteChange: () => {
						U.Space.initSpaceState();

						if (withImport) {
							this.props.close(() => {
								S.Popup.open('settings', { data: { isSpace: true, page: 'importIndex' }, className: 'isSpace' });
							});
						};

						if (onCreate) {
							onCreate(message.objectId);
						};
					} 
				});

				analytics.event('CreateSpace', { usecase: I.Usecase.GetStarted, middleTime: message.middleTime, route });
				analytics.event('SelectUsecase', { type: I.Usecase.GetStarted });
			});
		});
	};

	setLoading (isLoading: boolean) {
		this.state.isLoading = isLoading;
		this.setState({ isLoading });
	};

});

export default PopupSpaceCreate;