import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { I, S, U, translate, Action } from 'Lib';
import { observer } from 'mobx-react';

const PopupSettingsPageAppearance = observer(class PopupSettingsPageAppearance extends React.Component<I.PopupSettings> {

	render () {
		const { theme } = S.Common;
		const themes: any[] = [
			{ id: '', class: 'light', name: translate('popupSettingsAppearanceColorModeButtonLight') },
			{ id: 'dark', class: 'dark', name: translate('popupSettingsAppearanceColorModeButtonDark') },
			{ id: 'system', class: 'system', name: translate('popupSettingsAppearanceColorModeButtonSystem') },
		];

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsAppearanceTitle')} />
				<Label className="section" text={translate('popupSettingsAppearanceColorMode')} />

				<div className="buttons">
					{themes.map((item: any, i: number) => (
						<div
							key={i}
							className={[ 'btn', (theme == item.id ? 'active' : ''), item.class ].join(' ')}
							onClick={() => Action.themeSet(item.id)}
						>
							<div className="bg">
								<Icon />
							</div>
							<Label text={item.name} />
						</div>
					))}
				</div>
			</React.Fragment>
		);
	};

});

export default PopupSettingsPageAppearance;