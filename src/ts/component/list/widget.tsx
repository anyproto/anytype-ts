import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Button, Widget, DropTarget } from 'Component';
import { I, C, M, S, U, J, keyboard, analytics, translate } from 'Lib';

type State = {
	isEditing: boolean;
	previewId: string;
};

const ListWidget = observer(class ListWidget extends React.Component<{}, State> {
		
	state: State = {
		isEditing: false,
		previewId: '',
	};

	node = null;
	dropTargetId = '';
	position: I.BlockPosition = null;
	isDragging = false;
	frame = 0;

	constructor (props) {
		super(props);

		this.onEdit = this.onEdit.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.onLibrary = this.onLibrary.bind(this);
		this.onArchive = this.onArchive.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.setEditing = this.setEditing.bind(this);
		this.setPreview = this.setPreview.bind(this);
	};

	render (): React.ReactNode {
		const { isEditing, previewId } = this.state;
		const { widgets } = S.Block;
		const cn = [ 'listWidget' ];
		const canWrite = U.Space.canMyParticipantWrite();

		let content = null;

		if (previewId) {
			const block = S.Block.getLeaf(widgets, previewId);

			if (block) {
				cn.push('isListPreview');
				content = (
					<Widget 
						{...this.props}
						key={`widget-${block.id}`}
						block={block}
						isPreview={true}
						setPreview={this.setPreview}
						setEditing={this.setEditing}
					/>
				);
			};
		} else {
			const blocks = S.Block.getChildren(widgets, widgets, (block: I.Block) => {
				const childrenIds = S.Block.getChildrenIds(widgets, block.id);
				if (!childrenIds.length) {
					return false;
				};

				const child = S.Block.getLeaf(widgets, childrenIds[0]);
				if (!child) {
					return false;
				};

				const target = child.content.targetBlockId;

				if (Object.values(J.Constant.widgetId).includes(target)) {
					return true;
				};

				const object = S.Detail.get(widgets, target, [ 'isArchived', 'isDeleted' ], true);
				if (object._empty_ || object.isArchived || object.isDeleted) {
					return false;
				};

				return true;
			});

			let last = null;
			let first = null;
			let buttons: I.ButtonComponent[] = [];

			if (blocks.length) {
				first = blocks[0];
				last = blocks[blocks.length - 1];
			};

			if (isEditing) {
				cn.push('isEditing');
			};

			if (isEditing) {
				if (blocks.length <= J.Constant.limit.widgets) {
					buttons.push({ id: 'widget-list-add', text: translate('commonAdd'), onMouseDown: this.onAdd });
				};

				buttons.push({ id: 'widget-list-done', text: translate('commonDone'), onMouseDown: this.onEdit });
			} else 
			if (canWrite) {
				buttons = buttons.concat([
					{ id: 'widget-list-add', className: 'grey c28', text: translate('widgetAdd'), onMouseDown: this.onAdd },
					{ id: 'widget-list-edit', className: 'grey c28', text: translate('widgetEdit'), onMouseDown: this.onEdit }
				]);
			};

			content = (
				<React.Fragment>
					<DropTarget 
						{...this.props} 
						isTargetTop={true}
						rootId={S.Block.widgets} 
						id={first?.id}
						dropType={I.DropType.Widget} 
						canDropMiddle={false}
						className="firstTarget"
						cacheKey="firstTarget"
					>
						<Widget 
							block={new M.Block({ id: 'space', type: I.BlockType.Widget, content: { layout: I.WidgetLayout.Space } })} 
							disableContextMenu={true} 
							onDragStart={this.onDragStart}
							onDragOver={this.onDragOver}
							isEditing={isEditing}
						/>
					</DropTarget>

					{blocks.map((block, i) => (
						<Widget 
							{...this.props}
							key={`widget-${block.id}`}
							block={block}
							isEditing={isEditing}
							className="isEditable"
							onDragStart={this.onDragStart}
							onDragOver={this.onDragOver}
							setPreview={this.setPreview}
							setEditing={this.setEditing}
						/>
					))}

					<DropTarget 
						{...this.props} 
						isTargetBottom={true}
						rootId={S.Block.widgets} 
						id={last?.id}
						dropType={I.DropType.Widget} 
						canDropMiddle={false}
						className="lastTarget"
						cacheKey="lastTarget"
					>
						<Button 
							text={translate('widgetLibrary')}
							color="" 
							className="widget" 
							icon="store" 
							onClick={this.onLibrary} 
						/>
						<Button
							text={translate('widgetBin')}
							color=""
							className="widget"
							icon="bin"
							onClick={this.onArchive}
						/>
					</DropTarget>

					<div className="buttons">
						{buttons.map(button => (
							<Button key={button.id + (isEditing ? 'edit' : '')} color="" {...button} />
						))}
					</div>
				</React.Fragment>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				id="listWidget"
				className={cn.join(' ')}
				onDrop={this.onDrop}
				onDragOver={e => e.preventDefault()}
				onContextMenu={this.onContextMenu}
			>
				{content}
			</div>
		);
	};

	onEdit (e: any): void {
		e.stopPropagation();

		this.setEditing(!this.state.isEditing);
	};

	onAdd (e: any): void {
		e.stopPropagation();

		analytics.event('ClickAddWidget');

		S.Menu.open('searchObjectWidgetAdd', {
			component: 'searchObject',
			element: '#widget-list-add',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetY: -4,
			vertical: I.MenuDirection.Top,
			data: {
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: S.Record.getTemplateType()?.id },
				],
				canAdd: true,
				dataChange: (context: any, items: any[]) => {
					const reg = new RegExp(U.Common.regexEscape(context.filter), 'gi');
					const fixed: any[] = U.Menu.getFixedWidgets().filter(it => it.name.match(reg));

					return !items.length ? fixed : fixed.concat([ { isDiv: true } ]).concat(items);
				},
				onSelect: (target: any, isNew: boolean) => {
					const limitOptions = U.Menu.getWidgetLimitOptions(I.WidgetLayout.Link);
					const layoutOptions = U.Menu.getWidgetLayoutOptions(target.id, target.layout);
					const layout = layoutOptions.length ? layoutOptions[0].id : I.WidgetLayout.Link;

					const newBlock = { 
						type: I.BlockType.Link,
						content: { 
							targetBlockId: target.id, 
						},
					};

					C.BlockCreateWidget(S.Block.widgets, '', newBlock, I.BlockPosition.Top, layout, Number(limitOptions[0].id), (message: any) => {
						if (message.error.code) {
							return;
						};

						if (isNew) {
							U.Object.openConfig(target);
						};

						analytics.event('AddWidget', { type: I.WidgetLayout.Link });
						analytics.event('ChangeWidgetSource', {
							layout,
							route: 'AddWidget',
							params: { target },
						});
					});					
				},
			},
		});
	};

	onDragStart (e: React.DragEvent, blockId: string): void {
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const node = $(this.node);
		const obj = node.find(`#widget-${blockId}`);
		const clone = $('<div />').addClass('widget isClone').css({ 
			zIndex: 10000, 
			position: 'fixed', 
			left: -10000, 
			top: -10000,
			width: obj.outerWidth(),
		});

		clone.append(obj.find('.head').clone());
		node.append(clone);
		selection?.clear();

		keyboard.disableCommonDrop(true);
		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		this.isDragging = true;

		e.dataTransfer.setDragImage(clone.get(0), 0, 0);
		e.dataTransfer.setData('text', blockId);

		win.off('dragend.widget').on('dragend.widget', () => {
			this.clear();
			win.off('dragend.widget');
		});
	};

	onDragOver (e: React.DragEvent, blockId: string) {
		if (!this.isDragging) {
			return;
		};

		e.preventDefault();

		const target = $(e.currentTarget);
		const y = e.pageY - $(window).scrollTop();

		raf.cancel(this.frame);
		this.frame = raf(() => {
			this.clear();
			this.dropTargetId = blockId;

			const { top } = target.offset();
			const height = target.height();

			this.position = y <= top + height / 2 ? I.BlockPosition.Top : I.BlockPosition.Bottom;

			target.addClass([ 'isOver', (this.position == I.BlockPosition.Top ? 'top' : 'bottom') ].join(' '));
		});
	};

	onDrop (e: React.DragEvent): void {
		const { isEditing } = this.state;
		if (!isEditing) {
			//return;
		};

		e.stopPropagation();

		const { widgets } = S.Block;
		const blockId = e.dataTransfer.getData('text');

		if (blockId != this.dropTargetId) {
			C.BlockListMoveToExistingObject(widgets, widgets, this.dropTargetId, [ blockId ], this.position);
		};

		keyboard.disableCommonDrop(false);
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		this.isDragging = false;
		this.clear();
	};

	onLibrary (e: any) {
		const { isEditing } = this.state;

		if (!isEditing && !e.button) {
			U.Object.openEvent(e, { layout: I.ObjectLayout.Store });
		};
	};

	onArchive (e: any) {
		const { isEditing } = this.state;

		if (!isEditing && !e.button) {
			U.Object.openEvent(e, { layout: I.ObjectLayout.Archive });
		};
	};

	onContextMenu () {
		const { previewId } = this.state;
		if (previewId || !U.Space.canMyParticipantWrite()) {
			return;
		};

		const win = $(window);
		const widgetIds = S.Block.getChildrenIds(S.Block.widgets, S.Block.widgets);
		const options: any[] = [
			{ id: 'edit', name: translate('widgetEdit') },
		];

		if (widgetIds.length < J.Constant.limit.widgets) {
			options.unshift({ id: 'add', name: translate('widgetAdd'), arrow: true });
		};

		let menuContext = null;

		S.Menu.open('selectList', {
			component: 'select',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: (context) => {
				menuContext = context;
			},
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { x, y: y + win.scrollTop(), width: 0, height: 0, }; 
			},
			subIds: [ 'widget', 'searchObject', 'select' ],
			data: {
				options,
				onOver: (e: any, item: any) => {
					if (!menuContext) {
						return;
					};

					if (!item.arrow) {
						S.Menu.close('widget');
						return;
					};

					const { x, y } = keyboard.mouse.page;

					S.Menu.open('widget', {
						element: `#${menuContext.getId()} #item-${item.id}`,
						offsetX: menuContext.getSize().width,
						isSub: true,
						vertical: I.MenuDirection.Center,
						className: 'fixed',
						classNameWrap: 'fromSidebar',
						data: {
							coords: { x, y },
							onSave: () => {
								menuContext.close();
							}
						}
					});
				},
				onSelect: (e: any, item: any) => {
					if (item.arrow) {
						return;
					};

					switch (item.id) {
						case 'edit': {
							this.setEditing(true);
							menuContext.close();
							break;
						};
					};
				}
			}
		});
	};

	clear () {
		const node = $(this.node);

		node.find('.widget.isOver').removeClass('isOver top bottom');
		node.find('.widget.isClone').remove();

		this.dropTargetId = '';
		this.position = null;

		raf.cancel(this.frame);
	};

	setPreview (previewId: string) {
		this.setState({ previewId });
	};

	setEditing (isEditing: boolean) {
		this.setState({ isEditing });

		if (!isEditing) {
			return;
		};

		const win = $(window);
		const unbind = () => win.off('mousedown.sidebar keydown.sidebar');
		const close = e => {
			e.stopPropagation();

			this.setEditing(false);
			unbind();
		};

		unbind();
		analytics.event('EditWidget');

		window.setTimeout(() => {
			win.on('mousedown.sidebar', e => {
				if (!$(e.target).parents('.widget').length) {
					close(e);
				};
			});

			win.on('keydown.sidebar', e => {
				keyboard.shortcut('escape', e, () => close(e));
			});
		}, S.Menu.getTimeout());
	};

});

export default ListWidget;