import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, Mark, Util, focus } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
	blockStore?: any;
};

@inject('commonStore')
@inject('blockStore')
@observer
class MenuBlockAction extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onMenuClick = this.onMenuClick.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onMark = this.onMark.bind(this);
		this.onBlockSwitch = this.onBlockSwitch.bind(this);
	};

	render () {
		const { commonStore, blockStore, param } = this.props;
		const { data } = param;
		const { range } = focus;
		const { blockId, rootId } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == blockId; });

		if (!block) {
			return null;
		};
		
		const { content } = block;
		const { marks, style } = content;
		
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
						if (Mark.getInRange(marks, action.type, range)) {
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
	
	onMark (e: any, type: number) {
		const { commonStore, blockStore, param } = this.props;
		const { data } = param;
		const { range } = focus;
		const { blockId, rootId, onChange } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == blockId; });

		if (!block) {
			return;
		};
		
		const { from, to } = range;
		const { content } = block;
		const { marks } = content;
		
		focus.apply();
		
		switch (type) {
			default:
				commonStore.menuClose(this.props.id);
				onChange(Mark.toggle(marks, { type: type, param: '', range: { from: from, to: to } }));
				break;
				
			case I.MarkType.Link:
				let mark = Mark.getInRange(marks, type, { from: from, to: to });
				commonStore.popupOpen('prompt', {
					data: {
						placeHolder: 'Please enter URL',
						value: (mark ? mark.param : ''),
						onChange: (param: string) => {
							onChange(Mark.toggle(marks, { type: type, param: param, range: { from: from, to: to } }));
							focus.apply();
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
		const { commonStore } = this.props;
		
		commonStore.menuClose(this.props.id);
		focus.apply();
	};
	
	onBlockSwitch (e: any) {
		const { commonStore, param } = this.props;
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