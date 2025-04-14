import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Button, Widget, DropTarget, ShareBanner } from 'Component';
import { I, C, M, S, U, J, keyboard, analytics, translate } from 'Lib';

type State = {
	isEditing: boolean;
	previewId: string;
};

const SidebarPageWidget = observer(class SidebarPageWidget extends React.Component<{}, State> {
		
	state: State = {
		isEditing: false,
		previewId: '',
	};

	node = null;
	dropTargetId = '';
	position: I.BlockPosition = null;
	isDragging = false;
	frame = 0;
	isSubcribed = '';

	constructor (props) {
		super(props);

		this.onEdit = this.onEdit.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onArchive = this.onArchive.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.setEditing = this.setEditing.bind(this);
		this.setPreview = this.setPreview.bind(this);
	};

	render (): React.ReactNode {
		const { isEditing, previewId } = this.state;
		const { widgets } = S.Block;
		const { showVault } = S.Common;
		const cn = [ 'body' ];
		const space = U.Space.getSpaceview();
		const canWrite = U.Space.canMyParticipantWrite();
		const hasShareBanner = U.Space.hasShareBanner();

		if (isEditing) {
			cn.push('isEditing');
		};

		if (hasShareBanner) {
			cn.push('withShareBanner');
		};

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
				if (!block.isWidget()) {
					return false;
				};

				const childrenIds = S.Block.getChildrenIds(widgets, block.id);
				if (!childrenIds.length) {
					return false;
				};

				const child = S.Block.getLeaf(widgets, childrenIds[0]);
				if (!child) {
					return false;
				};

				const target = child.getTargetObjectId();

				if (Object.values(J.Constant.widgetId).includes(target)) {
					return true;
				};

				const object = S.Detail.get(widgets, target, [ 'isArchived', 'isDeleted' ], true);
				if (object._empty_ || object.isArchived || object.isDeleted) {
					return false;
				};

				return true;
			});

			let first = null;
			let buttons: I.ButtonComponent[] = [];

			if (blocks.length) {
				first = blocks[0];
			};

			if (isEditing) {
				if (blocks.length <= J.Constant.limit.widgets) {
					buttons.push({ id: 'widget-list-add', text: translate('commonAdd'), onMouseDown: e => this.onAdd(e, analytics.route.addWidgetEditor) });
				};

				buttons.push({ id: 'widget-list-done', text: translate('commonDone'), onMouseDown: this.onEdit });
			} else 
			if (canWrite) {
				buttons = buttons.concat([
					{ id: 'widget-list-add', className: 'grey c28', text: translate('commonAdd'), onMouseDown: e => this.onAdd(e, analytics.route.addWidgetMain) },
					{ id: 'widget-list-edit', className: 'grey c28', text: translate('commonEdit'), onMouseDown: this.onEdit }
				]);
			};

			content = (
				<>
					{space && !space._empty_ ? (
						<>
							{hasShareBanner ? <ShareBanner onClose={() => this.forceUpdate()} /> : ''}

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
						</>
					) : ''}

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

					<div className="buttons">
						{buttons.map(button => (
							<Button key={[ button.id, (isEditing ? 'edit' : '') ].join('-')} color="" {...button} />
						))}
					</div>
				</>
			);
		};

		return (
			<div 
				id="containerWidget"
				ref={node => this.node = node}
				className="customScrollbar"
			>
				<div id="head" className="head">
					<div className="name">{space.name}</div>
				</div>
				<div
					id="body"
					className={cn.join(' ')}
					onScroll={this.onScroll}
					onDrop={this.onDrop}
					onDragOver={e => e.preventDefault()}
				>
					{content}
				</div>
			</div>
		);
	};

	componentDidUpdate (): void {
		this.onScroll();
	};

	onEdit (e: any): void {
		e.stopPropagation();

		this.setEditing(!this.state.isEditing);
	};

	onAdd (e: any, route?: string): void {
		e.stopPropagation();

		analytics.event('ClickAddWidget', { route });

		const { widgets } = S.Block;
		const blocks = S.Block.getChildren(widgets, widgets, (block: I.Block) => block.isWidget());
		const targets = [];
		const node = $(this.node);
		const body = node.find('#body');
		const position = body.outerHeight() + 350 > node.outerHeight() ? I.MenuDirection.Top : I.MenuDirection.Bottom;

		blocks.forEach(block => {
			const children = S.Block.getChildren(widgets, block.id);
			if (children.length) {
				targets.push(children[0].getTargetObjectId());
			};
		});

		const onSelect = (target: any, isNew: boolean) => {
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

				analytics.createWidget(I.WidgetLayout.Link, route, analytics.widgetType.manual);
				analytics.event('ChangeWidgetSource', {
					layout,
					route: analytics.route.addWidget,
					params: { target },
				});
			});					
		};

		let menuContext = null;

		S.Menu.open('searchObjectWidgetAdd', {
			component: 'searchObject',
			element: '#widget-list-add',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetY: -4,
			vertical: position,
			onOpen: context => menuContext = context,
			subIds: J.Menu.widgetAdd,
			data: {
				route: analytics.route.addWidget,
				withPlural: true,
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
					{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
				],
				dataChange: (context: any, items: any[]) => {
					const skipLayouts = U.Object.getSystemLayouts().concat(I.ObjectLayout.Type);
					const reg = new RegExp(U.Common.regexEscape(context.filter), 'gi');
					const fixed: any[] = U.Menu.getSystemWidgets().filter(it => !targets.includes(it.id) && it.name.match(reg));
					const types = S.Record.checkHiddenObjects(S.Record.getTypes()).
						filter(it => !targets.includes(it.id) && !skipLayouts.includes(it.recommendedLayout) && !U.Object.isTemplate(it.id) && (it.name.match(reg) || it.pluralName.match(reg))).
						map(it => ({ ...it, caption: '' }));
					const lists = [];

					if (fixed.length) {
						lists.push([ { name: translate('commonSystem'), isSection: true } ].concat(fixed));
					};

					if (types.length) {
						lists.push([ { name: translate('commonSuggested'), isSection: true } ].concat(types));
					};

					if (items.length) {
						lists.push([ { name: translate('commonExistingObjects'), isSection: true } ].concat(items));
					};

					let ret = [];
					for (let i = 0; i < lists.length; ++i) {
						if (i > 0) {
							ret = ret.concat({ isDiv: true });
						};
						ret = ret.concat(lists[i]);
					};

					return ret;
				},
				onSelect,
			},
		});
	};

	onDragStart (e: React.DragEvent, blockId: string): void {
		e.stopPropagation();

		const canWrite = U.Space.canMyParticipantWrite();
		if (!canWrite) {
			return;
		};

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
		if (!this.isDragging) {
			return;
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

	onScroll () {
		const { showVault } = S.Common;
		const node = $(this.node);
		const head = node.find('#head');
		const body = node.find('#body');
		const top = body.scrollTop();

		head.toggleClass('show', showVault && (top > 32));
	};

	onArchive (e: any) {
		const { isEditing } = this.state;

		if (!isEditing && !e.button) {
			U.Object.openEvent(e, { layout: I.ObjectLayout.Archive });
		};
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

export default SidebarPageWidget;
