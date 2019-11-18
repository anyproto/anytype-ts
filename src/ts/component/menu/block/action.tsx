import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	editorStore?: any;
};

@inject('editorStore')
@observer
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
			{ icon: 'bold', name: 'Bold' },
			{ icon: 'italic', name: 'Italic' },
			{ icon: 'strike', name: 'Strikethrough' },
			{ icon: 'link', name: 'Link' },
			{ icon: 'kbd', name: 'Code' },
		];
		
		let icon = '';
		switch (style) {
			default:
			case I.TextStyle.Paragraph:
				icon = 'p';
				break;
				
			case I.TextStyle.Header1:
				icon = 'h1';
				break;
				
			case I.TextStyle.Header2:
				icon = 'h2';
				break;
				
			case I.TextStyle.Header3:
				icon = 'h3';
				break;
				
			case I.TextStyle.Header4:
				icon = 'h4';
				break;
				
			case I.TextStyle.Quote:
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
							
						return <Icon key={i} className={cn.join(' ')} onClick={(e: any) => { this.onClick(e, action.icon); }} />;
					})}
				</div>
					
				<div className="section">
					<Icon className="copy" onClick={(e: any) => { this.onClick(e, 'copy'); }} />
					<Icon className="remove" onClick={(e: any) => { this.onClick(e, 'remove'); }} />
				</div>
			</React.Fragment>
		);
	};
	
	onClick (e: any, id: string) {
		const { editorStore } = this.props;
		const { range } = editorStore;
		
		console.log('Range', range.from, range.to);
		
		switch (id) {
			default:
				commonStore.menuClose(this.props.id);
				break;
			
			case 'link':
				commonStore.popupOpen('prompt', {
					data: {
						placeHolder: 'Please enter URL',
						onChange: (v: string) => {
							console.log('value', v);
							
							commonStore.menuClose(this.props.id);
						}
					}
				});
				break;
		};
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