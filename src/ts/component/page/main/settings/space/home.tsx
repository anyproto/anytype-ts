import React, { forwardRef, useState } from 'react';
import { Title, Label, Button, Icon, Frame } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';

const HOME_OPTIONS = [
	{ id: 'chat', nameKey: 'settingsSpaceHomeOptionChat', typeKey: J.Constant.typeKey.chatDerived, layout: I.ObjectLayout.Chat, details: { name: 'defaultNameGeneral' } },
	{ id: 'page', nameKey: 'settingsSpaceHomeOptionPage', typeKey: J.Constant.typeKey.page, layout: I.ObjectLayout.Page },
	{ id: 'collection', nameKey: 'settingsSpaceHomeOptionCollection', typeKey: J.Constant.typeKey.collection, layout: I.ObjectLayout.Collection },
	{ id: 'empty', nameKey: 'settingsSpaceHomeOptionEmpty' },
];

const PageMainSettingsSpaceHome = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const spaceId = S.Common.space;
	const [ selected, setSelected ] = useState('chat');
	const [ isLoading, setIsLoading ] = useState(false);

	const onCreate = () => {
		if (isLoading) {
			return;
		};

		const option = HOME_OPTIONS.find(it => it.id == selected);

		analytics.event('CreateHomePage', { type: U.String.ucFirst(selected) });

		if (option.typeKey) {
			const details: any = {};

			if (option.details) {
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
					U.Object.openRoute({ id: message.objectId, layout: option.layout, spaceId });
				});
			});
		} else {
			C.WorkspaceSetHomepage(spaceId, I.HomePredefinedId.Widget, () => U.Space.openDashboard());
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
							<Icon className={[ 'preview', option.id ].join(' ')} />
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

});

export default PageMainSettingsSpaceHome;
