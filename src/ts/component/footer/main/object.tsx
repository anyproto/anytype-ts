import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { PieChart } from 'react-minimal-pie-chart';
import { I, J, S } from 'Lib';

const FooterMainObject = observer(forwardRef<{}, I.FooterComponent>((props, ref) => {

	const { show } = S.Progress;
	const theme = S.Common.getThemeClass();
	const skipState = [ I.ProgressState.Done, I.ProgressState.Canceled ];
	const skipType = [ I.ProgressType.Migrate, I.ProgressType.Update, I.ProgressType.UpdateCheck ];
	const list = S.Progress.getList(it => !skipType.includes(it.type) && !skipState.includes(it.state));
	const percent = S.Progress.getPercent(list);
	const color = J.Theme[theme].progress;

	return (
		<div className="buttons">
			{percent ? (
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
		</div>
	);

}));

export default FooterMainObject;