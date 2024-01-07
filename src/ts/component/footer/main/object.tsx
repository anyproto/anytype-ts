/** @format */

import * as React from 'react';
import { Icon } from 'Component';
import { I, Preview, translate } from 'Lib';

const FooterMainEdit = class FooterMainEdit extends React.Component<I.FooterComponent> {
	render() {
		const { onHelp } = this.props;

		return (
			<div
				id="button-help"
				className="iconWrap"
				onClick={onHelp}
				onMouseEnter={e =>
					this.onTooltipShow(e, translate('commonHelp'))
				}
				onMouseLeave={() => Preview.tooltipHide(false)}
			>
				<Icon />
				<div className="bg" />
			</div>
		);
	}

	onTooltipShow(e: any, text: string, caption?: string) {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({
				text: t,
				element: $(e.currentTarget),
				typeY: I.MenuDirection.Top,
			});
		}
	}
};

export default FooterMainEdit;
