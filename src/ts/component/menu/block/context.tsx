import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, C, Mark, Util, focus } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
	blockStore?: any;
};

@inject('commonStore')
@inject('blockStore')
@observer
class MenuBlockContext extends React.Component<Props, {}> {
	
	timeout: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onMenuClick = this.onMenuClick.bind(this);
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
		
		let canMark = true;
		let markActions = [
			{ type: I.MarkType.Bold, icon: 'bold', name: 'Bold' },
			{ type: I.MarkType.Italic, icon: 'italic', name: 'Italic' },
			{ type: I.MarkType.Strike, icon: 'strike', name: 'Strikethrough' },
			{ type: I.MarkType.Link, icon: 'link', name: 'Link' },
			{ type: I.MarkType.Code, icon: 'code', name: 'Code' },
		];
		
		// You can't mark code, as it's highlighted automatically
		if ([ I.TextStyle.Code ].indexOf(style) >= 0) {
			canMark = false;
		};
		
		// You can't make headers bold, since they are already bold
		if ([ I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3 ].indexOf(style) >= 0) {
			markActions = markActions.filter((it: any) => { return it.type != I.MarkType.Bold; });
		};
		
		let icon = Util.styleIcon(style);
		let colorMark = Mark.getInRange(marks, I.MarkType.TextColor, range);
		let bgMark = Mark.getInRange(marks, I.MarkType.BgColor, range);

		let color = (
			<div className={[ 'inner', (colorMark ? 'textColor textColor-' + colorMark.param : ''), (bgMark ? 'bgColor bgColor-' + bgMark.param : '') ].join(' ')}>A</div>
		);
		
		return (
			<div className="flex" onClick={this.onMenuClick}>
				<div className="section">
					<Icon id={'button-' + blockId + '-switch'} arrow={true} tooltip="Switch style" className={[ icon, 'blockStyle', (commonStore.menuIsOpen('blockStyle') ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onMark(e, 'style'); }} />
				</div>
				
				{canMark && markActions.length ? (
					<div className="section">
						{markActions.map((action: any, i: number) => {
							let cn = [ action.icon ];
							if (Mark.getInRange(marks, action.type, range)) {
								cn.push('active');
							};
							return <Icon key={i} className={cn.join(' ')} tooltip={action.name} onClick={(e: any) => { this.onMark(e, action.type); }} />;
						})}
					</div>
				) : ''}
				
				<div className="section">
					{canMark ? (
						<Icon id={'button-' + blockId + '-color'} className={[ 'color', (commonStore.menuIsOpen('blockColor') ? 'active' : '') ].join(' ')} inner={color} tooltip="Text colors" onClick={(e: any) => { this.onMark(e, I.MarkType.TextColor); }} />
					) : ''}
					<Icon id={'button-' + blockId + '-comment'} className="comment" tooltip="Comment" onClick={(e: any) => {}} />
					<Icon id={'button-' + blockId + '-more'} className={[ 'more', (commonStore.menuIsOpen('blockMore') ? 'active' : '') ].join(' ')} tooltip="More options" onClick={(e: any) => { this.onMark(e, 'more'); }} />
				</div>
			</div>
		);
	};
	
	onMark (e: any, type: any) {
		const { commonStore, blockStore, param } = this.props;
		const { data } = param;
		const { range } = focus;
		const { blockId, blockIds, rootId, onChange } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == blockId; });

		if (!block) {
			return;
		};
		
		const { from, to } = range;
		const { content } = block;
		
		focus.apply();
		
		let { marks } = content;		
		let mark: any = null;
		
		commonStore.menuClose('blockStyle');
		commonStore.menuClose('blockColor');
		commonStore.menuClose('select');
		
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			
			switch (type) {
				
				default:
					commonStore.menuClose(this.props.id);
					marks = Mark.toggle(marks, { type: type, param: '', range: { from: from, to: to } });
					onChange(marks);
					break;
					
				case 'style':
					commonStore.menuOpen('blockStyle', { 
						element: 'button-' + blockId + '-switch',
						type: I.MenuType.Vertical,
						offsetX: -12,
						offsetY: 4,
						vertical: I.MenuDirection.Bottom,
						horizontal: I.MenuDirection.Left,
						data: {
							rootId: rootId,
							blockId: blockId,
							onSelect: (style: I.TextStyle) => {
								C.BlockListSetTextStyle(rootId, blockIds, style);
								commonStore.menuClose(this.props.id);
							},
						}
					});
					break;
					
				case 'more':
					commonStore.menuOpen('blockMore', { 
						element: 'button-' + blockId + '-more',
						type: I.MenuType.Vertical,
						offsetX: -12,
						offsetY: 4,
						vertical: I.MenuDirection.Bottom,
						horizontal: I.MenuDirection.Left,
						data: {
							rootId: rootId,
							blockId: blockId,
							onSelect: (item: any) => {
								commonStore.menuClose(this.props.id);
							},
						}
					});
					break;
					
				case I.MarkType.Link:
					mark = Mark.getInRange(marks, type, { from: from, to: to });
					commonStore.popupOpen('prompt', {
						data: {
							placeHolder: 'Please enter URL',
							value: (mark ? mark.param : ''),
							onChange: (param: string) => {
								marks = Mark.toggle(marks, { type: type, param: param, range: { from: from, to: to } });
								onChange(marks);
								commonStore.menuClose(this.props.id);
							}
						},
						onClose: () => {
							console.log('CLOSE', focus);
							window.setTimeout(() => {
								focus.apply();
							}, 10);
						}
					});
					break;
					
				case I.MarkType.TextColor:
					let markText = Mark.getInRange(marks, I.MarkType.TextColor, { from: from, to: to });
					let markBg = Mark.getInRange(marks, I.MarkType.BgColor, { from: from, to: to });
					
					commonStore.menuOpen('blockColor', { 
						element: 'button-' + blockId + '-color',
						type: I.MenuType.Vertical,
						offsetX: -12,
						offsetY: 8,
						vertical: I.MenuDirection.Bottom,
						horizontal: I.MenuDirection.Left,
						data: {
							valueText: (markText ? markText.param : ''),
							valueBg: (markBg ? markBg.param : ''),
							onChangeText: (param: string) => {
								marks = Mark.toggle(marks, { type: I.MarkType.TextColor, param: param, range: { from: from, to: to } });
								onChange(marks);
								commonStore.menuClose(this.props.id);
							},
							onChangeBg: (param: string) => {
								marks = Mark.toggle(marks, { type: I.MarkType.BgColor, param: param, range: { from: from, to: to } });
								onChange(marks);
								commonStore.menuClose(this.props.id);
							},
						},
					});
					break;
			};
		}, 250);
	};
	
	onMenuClick () {
		focus.apply();
	};
	
	onBlockSwitch (e: any) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		
		commonStore.menuOpen('blockStyle', { 
			element: 'button-switch',
			type: I.MenuType.Vertical,
			offsetX: -12,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				onSelect: (style: I.TextStyle) => {
					C.BlockListSetTextStyle(rootId, blockIds, style);
					commonStore.menuClose(this.props.id);
				},
			}
		});
	};

};

export default MenuBlockContext;