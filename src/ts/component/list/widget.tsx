import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Button, Widget, DropTarget } from 'Component';
import { C, I, M, keyboard, UtilObject, analytics, translate, UtilSpace } from 'Lib';
import { blockStore, menuStore, detailStore } from 'Store';
const Constant = require('json/constant.json');

interface Props {
	dataset?: any;
};

type State = {
	isEditing: boolean;
	previewId: string;
};

const ListWidget = observer(class ListWidget extends React.Component<Props, State> {
		
	state: State = {
		isEditing: false,
		previewId: '',
	};

	node = null;
	dropTargetId = '';
	position: I.BlockPosition = null;
	isDragging = false;
	frame = 0;

	constructor (props: Props) {
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

	render(): React.ReactNode {
		const { isEditing, previewId } = this.state;
		const { widgets } = blockStore;
		const cn = [ 'listWidget' ];
		const canWrite = UtilSpace.canMyParticipantWrite();

		let content = null;

		if (previewId) {
			const block = blockStore.getLeaf(widgets, previewId);

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
			const buttons: I.ButtonComponent[] = [];
			const blocks = blockStore.getChildren(widgets, widgets, (block: I.Block) => {
				const childrenIds = blockStore.getChildrenIds(widgets, block.id);
				if (!childrenIds.length) {
					return false;
				};

				const child = blockStore.getLeaf(widgets, childrenIds[0]);
				if (!child) {
					return false;
				};

				const target = child.content.targetBlockId;

				if (Object.values(Constant.widgetId).includes(target)) {
					return true;
				};

				const object = detailStore.get(widgets, target, [ 'isArchived', 'isDeleted' ], true);
				if (object._empty_ || object.isArchived || object.isDeleted) {
					return false;
				};

				return true;
			});

			let last = null;
			let first = null;

			if (blocks.length) {
				first = blocks[0];
				last = blocks[blocks.length - 1];
			};

			if (isEditing) {
				cn.push('isEditing');
			};

			if (isEditing) {
				if (blocks.length <= Constant.limit.widgets) {
					buttons.push({ id: 'widget-list-add', text: translate('commonAdd'), onMouseDown: this.onAdd });
				};

				buttons.push({ id: 'widget-list-done', text: translate('commonDone'), onMouseDown: this.onEdit });
			} else 
			if (canWrite) {
				buttons.push({ id: 'widget-list-edit', className: 'edit c28', text: translate('widgetEdit'), onMouseDown: this.onEdit });
			};

			content = (
				<React.Fragment>
					<DropTarget 
						{...this.props} 
						isTargetTop={true}
						rootId={blockStore.widgets} 
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
						rootId={blockStore.widgets} 
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
						{canWrite ? (
							<Button 
								text={translate('widgetBin')}
								color="" 
								className="widget" 
								icon="bin" 
								onClick={this.onArchive} 
							/>
						) : ''}
					</DropTarget>

					<div className="buttons">
						{buttons.map(button => (
							<Button key={button.id} color="" {...button} />
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

		menuStore.open('widget', {
			element: '#widget-list-add',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetY: -2,
			subIds: Constant.menuIds.widget,
			vertical: I.MenuDirection.Top,
			data: {
				setEditing: this.setEditing,
			}
		});
	};

	onDragStart (e: React.DragEvent, blockId: string): void {
		e.stopPropagation();

		const { dataset } = this.props;
		const { selection, preventCommonDrop } = dataset;
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

		preventCommonDrop(true);
		selection.clear();
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
			return;
		};

		e.stopPropagation();

		const { dataset } = this.props;
		const { preventCommonDrop } = dataset;
		const { widgets } = blockStore;
		const blockId = e.dataTransfer.getData('text');

		if (blockId != this.dropTargetId) {
			C.BlockListMoveToExistingObject(widgets, widgets, this.dropTargetId, [ blockId ], this.position);
		};

		preventCommonDrop(false);
		keyboard.disableSelection(false);
		keyboard.setDragging(false);
		this.isDragging = false;
		this.clear();
	};

	onLibrary (e: any) {
		const { isEditing } = this.state;

		if (!isEditing && !e.button) {
			UtilObject.openEvent(e, { layout: I.ObjectLayout.Store });
		};
	};

	onArchive (e: any) {
		const { isEditing } = this.state;

		if (!isEditing && !e.button) {
			UtilObject.openEvent(e, { layout: I.ObjectLayout.Archive });
		};
	};

	onContextMenu () {
		const { previewId } = this.state;
		if (previewId || !UtilSpace.canMyParticipantWrite()) {
			return;
		};

		const win = $(window);
		const widgetIds = blockStore.getChildrenIds(blockStore.widgets, blockStore.widgets);
		const options: any[] = [
			{ id: 'edit', name: translate('widgetEdit') },
		];

		if (widgetIds.length < Constant.limit.widgets) {
			options.unshift({ id: 'add', name: translate('widgetAdd'), arrow: true });
		};

		let menuContext = null;

		menuStore.open('selectList', {
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
						menuStore.close('widget');
						return;
					};

					const { x, y } = keyboard.mouse.page;

					menuStore.open('widget', {
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
		}, menuStore.getTimeout());
	};

});

export default ListWidget;