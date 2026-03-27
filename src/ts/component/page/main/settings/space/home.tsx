import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon, Frame } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';

const HOME_OPTIONS = [
	{ id: 'chat', nameKey: 'settingsSpaceHomeOptionChat' },
	{ id: 'page', nameKey: 'settingsSpaceHomeOptionPage' },
	{ id: 'collection', nameKey: 'settingsSpaceHomeOptionCollection' },
	{ id: 'empty', nameKey: 'settingsSpaceHomeOptionEmpty' },
];

const PageMainSettingsSpaceHome = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const spaceId = S.Common.space;
	const [ selected, setSelected ] = useState('chat');
	const [ isLoading, setIsLoading ] = useState(false);

	const onCreate = () => {
		if (isLoading) {
			return;
		};

		analytics.event('ChannelSelectHome', { type: selected });

		if (selected == 'chat') {
			C.WorkspaceSetInfo(spaceId, { spaceDashboardId: I.HomePredefinedId.Chat }, () => {
				U.Space.openDashboard();
			});
		} else
		if (selected == 'empty') {
			C.WorkspaceSetInfo(spaceId, { spaceDashboardId: I.HomePredefinedId.Last }, () => {
				U.Space.openDashboard();
			});
		} else
		if (selected == 'page') {
			setIsLoading(true);
			C.ObjectCreate({}, [], '', J.Constant.typeKey.page, spaceId, (message: any) => {
				setIsLoading(false);
				if (!message.error.code) {
					C.WorkspaceSetInfo(spaceId, { spaceDashboardId: message.objectId }, () => {
						U.Space.openDashboard();
					});
				};
			});
		} else
		if (selected == 'collection') {
			setIsLoading(true);
			C.ObjectCreate({}, [], '', J.Constant.typeKey.collection, spaceId, (message: any) => {
				setIsLoading(false);
				if (!message.error.code) {
					C.WorkspaceSetInfo(spaceId, { spaceDashboardId: message.objectId }, () => {
						U.Space.openDashboard();
					});
				};
			});
		};
	};

	return (
		<Frame>
			<Title text={translate('settingsSpaceHomeTitle')} />
			<Label text={translate('settingsSpaceHomeDescription')} />

			<div className="homeOptions">
				{HOME_OPTIONS.map(option => {
					const cn = [ 'option' ];

					if (option.id == selected) {
						cn.push('active');
					};

					return (
						<div
							key={option.id}
							className={cn.join(' ')}
							onClick={() => setSelected(option.id)}
						>
							<Icon icon={`./img/${S.Common.getThemePath()}icon/settings/${option.id}.svg`} className="preview" />
							<div className="optionName">{translate(option.nameKey)}</div>
						</div>
					);
				})}
			</div>

			<div className="buttons">
				<Button text={translate('commonCreate')} color="accent" onClick={onCreate} />
			</div>
		</Frame>
	);

}));

export default PageMainSettingsSpaceHome;
