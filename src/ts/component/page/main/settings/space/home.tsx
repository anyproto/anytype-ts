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

	const setHomepage = (id: string) => {
		C.WorkspaceSetHomepage(spaceId, id, () => U.Space.openDashboard());
	};

	const createAndSetHomepage = (details: any, typeKey: string) => {
		setIsLoading(true);
		C.ObjectCreate(details, [], '', typeKey, spaceId, (message: any) => {
			setIsLoading(false);
			if (!message.error.code) {
				setHomepage(message.objectId);
			};
		});
	};

	const onCreate = () => {
		if (isLoading) {
			return;
		};

		analytics.event('ChannelSelectHome', { type: selected });

		switch (selected) {
			case 'chat': {
				createAndSetHomepage({ name: translate('defaultNameGeneral') }, J.Constant.typeKey.chatDerived);
				break;
			};

			case 'page': {
				createAndSetHomepage({}, J.Constant.typeKey.page);
				break;
			};

			case 'collection': {
				createAndSetHomepage({}, J.Constant.typeKey.collection);
				break;
			};

			case 'empty': {
				setHomepage(I.HomePredefinedId.Last);
				break;
			};
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

}));

export default PageMainSettingsSpaceHome;
