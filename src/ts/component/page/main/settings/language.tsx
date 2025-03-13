import React, { forwardRef, useRef } from 'react';
import { Title, Label, Select, Switch } from 'Component';
import { I, S, U, translate, Action, analytics } from 'Lib';
import { observer } from 'mobx-react';

const PageMainSettingsLanguage = observer(forwardRef<{}, I.PageSettingsComponent>((props, ref) => {

	const { config, interfaceLang, showRelativeDates, dateFormat, timeFormat, firstDay } = S.Common;
	const { languages } = config;
	const interfaceLanguages = U.Menu.getInterfaceLanguages();
	const spellingRef = useRef(null);
	const firstDayOptions = [
		{ id: 1, name: translate('day1') },
		{ id: 7, name: translate('day7') },
	];

	const getSpellingLanguages = () => {
		const { languages } = config;

		return U.Menu.getSpellingLanguages().sort((c1, c2) => {
			const idx1 = languages.indexOf(c1.id) >= 0;
			const idx2 = languages.indexOf(c2.id) >= 0;

			if (!c1.id && c2.id) return -1;
			if (c1.id && !c2.id) return 1;

			if (idx1 && !idx2) return -1;
			if (!idx1 && idx2) return 1; 
			return 0;
		});
	};

	return (
		<>
			<Title text={translate('pageSettingsLanguageTitle')} />

			<Label className="section" text={translate('popupSettingsPersonalSectionLanguage')} />
			<div className="actionItems">

				<div className="item">
					<Label text={translate('popupSettingsPersonalSpellcheckLanguage')} />

					<Select
						id="spellcheck"
						ref={spellingRef}
						value={languages}
						options={getSpellingLanguages()}
						onChange={v => {
							Action.setSpellingLang(v);

							const options = getSpellingLanguages();

							spellingRef.current?.setOptions(options);
							S.Menu.updateData('select', { options });
						}}
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

				<div className="item">
					<Label text={translate('popupSettingsPersonalFirstDay')} />
					<Select
						id="firstDay"
						value={String(firstDay)}
						options={firstDayOptions}
						onChange={v => S.Common.firstDaySet(v)}
						arrowClassName="black"
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>

			</div>
		</>
	);

}));

export default PageMainSettingsLanguage;
