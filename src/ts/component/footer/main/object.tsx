import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { PieChart } from 'react-minimal-pie-chart';
import { Icon } from 'Component';
import { I, J, S, Preview, translate } from 'Lib';

const FooterMainObject = observer(forwardRef<{}, I.FooterComponent>((props, ref) => {

	const { onHelp } = props;
	const { show } = S.Progress;
	const theme = S.Common.getThemeClass();
	const current = S.Progress.getCurrent();
	const total = S.Progress.getTotal();
	const percent = Math.round((current / total) * 100);
	const color = J.Theme[theme].progress;

	const onTooltipShow = (e: any, text: string, caption?: string) => {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget), typeY: I.MenuDirection.Top });
		};
	};

	return (
		<div className="buttons">
			{total ? (
				<div 
					id="button-progress"
					className="iconWrap"
					onClick={() => S.Progress.showSet(!show)}
				>
					<div className="inner">{percent}</div>
					<PieChart
						totalValue={100}
						startAngle={270}
						lengthAngle={-360}
						data={[ 
							{ title: '', value: 100 - percent, color: color.bg },
							{ title: '', value: percent, color: color.fg },
						]}
					/>
				</div>
			) : ''}

			<div 
				id="button-help" 
				className="iconWrap" 
				onClick={onHelp}
				onMouseEnter={e => onTooltipShow(e, translate('commonHelp'))}
				onMouseLeave={() => Preview.tooltipHide(false)}
			>
				<Icon />
				<div className="bg" />
			</div>
		</div>
	);

}));

export default FooterMainObject;