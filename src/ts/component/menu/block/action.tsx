import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {
};

class MenuBlockAction extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onBlockSwitch = this.onBlockSwitch.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { content } = data;
		const { style } = content;
		
		const markActions = [
			{ icon: 'b', name: 'Bold' },
			{ icon: 'i', name: 'Italic' },
			{ icon: 's', name: 'Strikethrough' },
			{ icon: 'a', name: 'Link' },
			{ icon: 'kbd', name: 'Code' },
		];
		
		let icon = '';
		switch (style) {
			default:
			case I.TextStyle.p:
				icon = 'p';
				break;
				
			case I.TextStyle.h1:
				icon = 'h1';
				break;
				
			case I.TextStyle.h2:
				icon = 'h2';
				break;
				
			case I.TextStyle.h3:
				icon = 'h3';
				break;
				
			case I.TextStyle.h4:
				icon = 'h4';
				break;
				
			case I.TextStyle.quote:
				icon = 'quote';
				break;
		};
		
		return (
			<React.Fragment>
				<div className="section">
					<Icon id="button-switch" arrow={true} className={[ icon, 'blockSwitch', (commonStore.menuIsOpen('blockSwitch') ? 'active' : '') ].join(' ')} onClick={this.onBlockSwitch} />
				</div>
					
				<div className="section">
					{markActions.map((action: any, i: number) => {
						let cn = [ action.icon ];
							
						return <Icon key={i} className={cn.join(' ')} onClick={(e: any) => { this.onClick(e); }} />;
					})}
				</div>
					
				<div className="section">
					<Icon className="copy" onClick={(e: any) => { this.onClick(e); }} />
					<Icon className="remove" onClick={(e: any) => { this.onClick(e); }} />
				</div>
			</React.Fragment>
		);
	};
	
	onClick (e: any) {
		commonStore.menuClose(this.props.id);
	};
	
	onBlockSwitch (e: any) {
		commonStore.menuOpen('blockSwitch', { 
			element: 'button-switch',
			type: I.MenuType.Vertical,
			offsetX: 36,
			offsetY: 0,
			light: false,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Left
		});
	};

};

export default MenuBlockAction;