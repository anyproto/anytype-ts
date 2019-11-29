import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, focus } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {};

class MenuBlockAction extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onMenuClick = this.onMenuClick.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onMark = this.onMark.bind(this);
		this.onBlockSwitch = this.onBlockSwitch.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { content } = data;
		const { style } = content;
		const { range } = focus;
		
		const markActions = [
			{ type: I.MarkType.Bold, icon: 'bold', name: 'Bold' },
			{ type: I.MarkType.Italic, icon: 'italic', name: 'Italic' },
			{ type: I.MarkType.Strike, icon: 'strike', name: 'Strikethrough' },
			{ type: I.MarkType.Link, icon: 'link', name: 'Link' },
			{ type: I.MarkType.Code, icon: 'code', name: 'Code' },
		];
		
		let icon = '';
		switch (style) {
			default:
			case I.TextStyle.Paragraph:
				icon = 'text';
				break;
				
			case I.TextStyle.Header1:
				icon = 'header1';
				break;
				
			case I.TextStyle.Header2:
				icon = 'header2';
				break;
				
			case I.TextStyle.Header3:
				icon = 'header3';
				break;
				
			case I.TextStyle.Header4:
				icon = 'header4';
				break;
				
			case I.TextStyle.Quote:
				icon = 'quote';
				break;
		};
		
		return (
			<div className="flex" onClick={this.onMenuClick}>
				<div className="section">
					<Icon id="button-switch" arrow={true} className={[ icon, 'blockSwitch', (commonStore.menuIsOpen('blockSwitch') ? 'active' : '') ].join(' ')} onClick={this.onBlockSwitch} />
				</div>
					
				<div className="section">
					{markActions.map((action: any, i: number) => {
						let cn = [ action.icon ];
						if (this.checkActiveMark(action.type)) {
							cn.push('active');
						};
						return <Icon key={i} className={cn.join(' ')} tooltip={action.name} onClick={(e: any) => { this.onMark(e, action.type); }} />;
					})}
				</div>
					
				<div className="section">
					<Icon className="copy" tooltip="Copy block" onClick={(e: any) => { this.onClick(e, 'copy'); }} />
					<Icon className="remove" tooltip="Remove block" onClick={(e: any) => { this.onClick(e, 'remove'); }} />
				</div>
			</div>
		);
	};
	
	checkActiveMark (type: number) {
		const { param } = this.props;
		const { data } = param;
		const { content } = data;
		const { range } = focus;
		const marks = content.marks.filter((it: I.Mark) => { return it.type == type; });
		
		for (let mark of marks) {
			if (range.from >= mark.range.from && range.to <= mark.range.to) {
				return true;
			};
		};
		
		return false;
	};
	
	onMark (e: any, type: number) {
		const { focused, range } = focus;
		
		focus.apply();
		
		console.log('type', type, 'focused', focused, 'range', range.from, range.to);
		commonStore.menuClose(this.props.id);
		
		switch (type) {
			case I.MarkType.Link:
				commonStore.popupOpen('prompt', {
					data: {
						placeHolder: 'Please enter URL',
						onChange: (v: string) => {
							console.log('value', v);
						}
					}
				});
				break;
		};
	};
	
	onMenuClick () {
		focus.apply();
	};
	
	onClick (e: any, id: string) {
		commonStore.menuClose(this.props.id);
		focus.apply();
	};
	
	onBlockSwitch (e: any) {
		const { param } = this.props;
		const { data } = param;
		
		commonStore.menuOpen('blockSwitch', { 
			element: 'button-switch',
			type: I.MenuType.Vertical,
			offsetX: 56,
			offsetY: -36,
			light: true,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: data,
			onClose: () => {
				commonStore.menuClose(this.props.id);
			}
		});
	};

};

export default MenuBlockAction;