import React, { forwardRef } from 'react';
import { Title, Label, Select, Switch } from 'Component';
import { I, S, U, translate, Action, analytics } from 'Lib';
import { observer } from 'mobx-react';

const PageMainSettingsLanguage = observer(forwardRef<{}, I.PageSettingsComponent>((props, ref) => {

	const { config, interfaceLang, showRelativeDates, dateFormat, timeFormat, } = S.Common;
	const { languages } = config;
	const interfaceLanguages = U.Menu.getInterfaceLanguages();
	const spellingLanguages = U.Menu.getSpellingLanguages();

	return (
		<>
			<Title text={translate('pageSettingsLanguageTitle')} />

			<Label className="section" text={translate('popupSettingsPersonalSectionLanguage')} />

			<div className="actionItems">

				<div className="item">
					<Label text={translate('popupSettingsPersonalSpellcheckLanguage')} />

					<Select
						id="spellcheck"
						value={languages}
						options={spellingLanguages}
						onChange={v => Action.setSpellingLang(v)}
						arrowClassName="black"
						isMultiple={true}
						noFilter={false}
						menuParam={{ horizontal: I.MenuDirection.Right, width: 300 }}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalInterfaceLanguage')} />

					<Select
						id="interfaceLang"
						value={interfaceLang}
						options={interfaceLanguages}
						onChange={v => Action.setInterfaceLang(v)}
						arrowClassName="black"
						menuParam={{ horizontal: I.MenuDirection.Right, width: 300 }}
					/>
				</div>
			</div>

			<Label className="section" text={translate('popupSettingsPersonalSectionDateTime')} />

			<div className="actionItems">

				<div className="item">
					<Label text={translate('popupSettingsPersonalDateFormat')} />
					<Select
						id="dateFormat"
						value={String(dateFormat)}
						options={U.Menu.dateFormatOptions()}
						onChange={v => {
							S.Common.dateFormatSet(v);
							analytics.event('ChangeDateFormat', { type: v });
						}}
						arrowClassName="black"
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalTimeFormat')} />
					<Select
						id="timeFormat"
						value={String(timeFormat)}
						options={U.Menu.timeFormatOptions()}
						onChange={v => {
							S.Common.timeFormatSet(v);
							analytics.event('ChangeTimeFormat', { type: v });
						}}
						arrowClassName="black"
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalRelativeDates')} />
					<Switch
						className="big"
						value={showRelativeDates}
						onChange={(e: any, v: boolean) => {
							S.Common.showRelativeDatesSet(v);
							analytics.event('RelativeDates', { type: v });
						}}
					/>
				</div>

			</div>
		</>
	);

}));

export default PageMainSettingsLanguage;
