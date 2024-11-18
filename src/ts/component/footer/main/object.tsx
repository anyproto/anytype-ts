import * as React from 'react';
import { observer } from 'mobx-react';
import { PieChart } from 'react-minimal-pie-chart';
import { Icon } from 'Component';
import { I, S, Preview, translate } from 'Lib';

const FooterMainEdit = observer(class FooterMainEdit extends React.Component<I.FooterComponent> {
	
	render () {
		const { onHelp } = this.props;
		const { show } = S.Progress;
		const current = S.Progress.getCurrent();
		const total = S.Progress.getTotal();
		const percent = Math.round((current / total) * 100);

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
								{ title: '', value: 100 - percent, color: '#ebebeb' },
								{ title: '', value: percent, color: '#ffd15b' },
							]}
						/>
					</div>
				) : ''}
				<div 
					id="button-help" 
					className="iconWrap" 
					onClick={onHelp}
					onMouseEnter={e => this.onTooltipShow(e, translate('commonHelp'))}
					onMouseLeave={() => Preview.tooltipHide(false)}
				>
					<Icon />
					<div className="bg" />
				</div>
			</div>
		);
	};

	onTooltipShow (e: any, text: string, caption?: string) {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget), typeY: I.MenuDirection.Top });
		};
	};

});

export default FooterMainEdit;