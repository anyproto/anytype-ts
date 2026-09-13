import React, { FC } from 'react';
import { Icon, Label } from 'Component';

const LABEL = {
	importIndex: 'popupSettingsImportTitle',
	exportIndex: 'popupSettingsExportTitle',
};

interface Props {
	page: string;
};

/**
 * Leads back to the index a format was picked from. A format page is otherwise
 * only reachable through that index, and nothing on it leads back, so choosing a
 * different format meant going out to the sidebar.
 *
 * Rendered by each page rather than by the settings router so it can sit under
 * the page title instead of above the logo.
 */
const PageMainSettingsBack: FC<Props> = ({ page }) => (
	<div className="back" onClick={() => Action.openSettings(page, '')}>
		<Icon name="arrow/chevronLeft" size={16} />
		<Label text={translate(LABEL[page])} />
	</div>
);

export default PageMainSettingsBack;
