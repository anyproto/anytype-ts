import React, { forwardRef, useState } from 'react';
import { Title, Label, Button, Icon } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';

const HOME_OPTIONS = [
	{ id: 'chat', nameKey: 'settingsSpaceHomeOptionChat', typeKey: J.Constant.typeKey.chatDerived, layout: I.ObjectLayout.Chat, details: { name: 'defaultNameGeneral' } },
	{ id: 'page', nameKey: 'settingsSpaceHomeOptionPage', typeKey: J.Constant.typeKey.page, layout: I.ObjectLayout.Page },
	{ id: 'collection', nameKey: 'settingsSpaceHomeOptionCollection', typeKey: J.Constant.typeKey.collection, layout: I.ObjectLayout.Collection },
] as const;

type HomeOptionId = typeof HOME_OPTIONS[number]['id'];

interface PopupSpaceHomeData {
	spaceId?: string;
}

const PopupSpaceHome = forwardRef<{}, I.Popup>(({ param, close }, ref) => {

	const data: PopupSpaceHomeData = param?.data || {};
	const spaceId = data.spaceId || S.Common.space;
	const [ selected, setSelected ] = useState<HomeOptionId>('chat');
	const [ isLoading, setIsLoading ] = useState(false);

	const switchToSpace = (onRouteChange?: () => void) => {
		U.Router.switchSpace(spaceId, '', true, { onRouteChange }, false);
	};

	const onContinue = () => {
		if (isLoading) {
			return;
		};

		const option = HOME_OPTIONS.find(it => it.id == selected)!;

		analytics.event('CreateHomePage', { type: U.String.ucFirst(selected) });

		const details: any = {};

		if ('details' in option) {
			for (const key in option.details) {
				details[key] = translate(option.details[key]);
			};
		};

		setIsLoading(true);
		C.ObjectCreate(details, [], '', option.typeKey, spaceId, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				return;
			};

			C.WorkspaceSetHomepage(spaceId, message.objectId, () => {
				close(() => {
					switchToSpace(() => {
						U.Object.openRoute({ id: message.objectId, layout: option.layout, spaceId });
					});
				});
			});
		});
	};

	const onNotNow = () => {
		if (isLoading) {
			return;
		};

		analytics.event('CreateHomePage', { type: 'NotNow' });
		C.WorkspaceSetHomepage(spaceId, I.HomePredefinedId.Widget, () => {
			close(() => {
				switchToSpace(() => U.Space.openDashboard());
			});
		});
	};

	return (
		<div className="wrapper">
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
							<Icon className={[ 'preview', option.id ].join(' ')} />
							<div className="optionName">{translate(option.nameKey)}</div>
						</div>
					);
				})}
			</div>

			<div className="buttons">
				<Button text={translate('commonNotNow')} color="blank" onClick={onNotNow} />
				<Button text={translate('commonContinue')} color="accent" onClick={onContinue} />
			</div>
		</div>
	);

});

export default PopupSpaceHome;
