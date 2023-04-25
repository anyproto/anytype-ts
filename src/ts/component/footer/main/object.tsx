import * as React from 'react';
import { Icon } from 'Component';
import { I, keyboard, Preview } from 'Lib';

const FooterMainEdit = class FooterMainEdit extends React.Component<I.FooterComponent> {
	
	render () {
		const { onHelp, onAdd } = this.props;
		const cmd = keyboard.cmdSymbol();

		return (
			<React.Fragment>
				<div 
					id="button-add" 
					className="iconWrap" 
					onClick={onAdd}
					onMouseEnter={e => this.onTooltipShow(e, 'Add new object', `${cmd} + N`)}
				>
					<Icon />
					<div className="bg" />
				</div>

				<div 
					id="button-help" 
					className="iconWrap" 
					onClick={onHelp}
					onMouseEnter={e => this.onTooltipShow(e, 'Help')}
				>
					<Icon />
					<div className="bg" />
				</div>
			</React.Fragment>
		);
	};

	onTooltipShow (e: any, text: string, caption?: string) {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget), typeY: I.MenuDirection.Top });
		};
	};

};

export default FooterMainEdit;