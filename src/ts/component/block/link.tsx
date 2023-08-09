import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, IconObject, Loader, ObjectName, Cover } from 'Component';
import { I, UtilCommon, UtilData, UtilObject, translate, keyboard, focus, Preview } from 'Lib';
import { detailStore, blockStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

const BlockLink = observer(class BlockLink extends React.Component<I.BlockComponent> {
	
	_isMounted = false;
	node: any = null;
	frame = 0;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render() {
		const { rootId, block } = this.props;
		const object = detailStore.get(rootId, block.content.targetBlockId, Constant.coverRelationKeys);
		const { _empty_, isArchived, isDeleted, done, layout, coverId, coverType, coverX, coverY, coverScale } = object;
		const content = UtilData.checkLinkSettings(block.content, layout);
		const readonly = this.props.readonly || !blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
		const { description, cardStyle, relations } = content;
		const { size, iconSize } = this.getIconSize();
		const type = dbStore.getType(object.type);
		const cn = [ 'focusable', 'c' + block.id, 'resizable' ];

		const canDescription = ![ I.ObjectLayout.Note ].includes(object.layout);
		const withIcon = content.iconSize != I.LinkIconSize.None;
		const withType = relations.includes('type');
        const withCover = relations.includes('cover') && coverId && coverType;

		if ((layout == I.ObjectLayout.Task) && done) {
			cn.push('isDone');
		};

		if (isArchived) {
			cn.push('isArchived');
		};

		let element = null;
		if (_empty_) {
			element = (
				<div 
					className="loading" 
					{...UtilCommon.dataProps({ 'target-block-id': object.id })}
				>
					<Loader />
					<div className="name">{translate('blockLinkSyncing')}</div>
				</div>
			);
		} else 
		if (isDeleted) {
			element = (
				<div className="deleted">
					<Icon className="ghost" />
					<div className="name">{translate('commonDeletedObject')}</div>
				</div>
			);
		} else {
			const cnc = [ 'linkCard', UtilData.layoutClass(object.id, layout), 'c' + size ];
			const cns = [ 'sides' ];
			const cnl = [ 'side', 'left' ];
			
			if (withCover) {
				cnc.push('withCover');
			};

			if (block.bgColor) {
				cns.push('withBgColor');
				cnl.push('bgColor bgColor-' + block.bgColor);
			};

			let descr = '';
			let archive = null;
			let icon = null;
			let div = null;

			if (canDescription) {
				if (description == I.LinkDescription.Added) {
					descr = object.description;
				};
				if (description == I.LinkDescription.Content) {
					descr = object.snippet;
				};
			};

			if (isArchived) {
				archive = <div className="tagItem isTag archive">{translate('blockLinkArchived')}</div>;
			};

			if (cardStyle == I.LinkCardStyle.Text) {
				div = (
					<div className="div">
						<div className="inner" />
					</div>
				);
			};

			if (withIcon) {
				icon = (
					<IconObject 
						id={`block-${block.id}-icon`}
						size={size}
						iconSize={iconSize}
						object={object} 
						canEdit={!readonly && !isArchived} 
						onSelect={this.onSelect} 
						onUpload={this.onUpload} 
						onCheckbox={this.onCheckbox} 
					/>
				);
			};

			let n = 1;
			if (descr) n++;
			if (withType && type) n++;
			cnc.push('c' + n);

			element = (
				<div className={cnc.join(' ')} onMouseDown={this.onClick}>
					<div id="sides" className={cns.join(' ')}>
						<div key="sideLeft" className={cnl.join(' ')}>
							<div className="relationItem cardName">
								{icon}
								<ObjectName object={object} />
								{archive}
							</div>

							{descr ? (
								<div className="relationItem cardDescription">
									{div}
									<div className="description">{descr}</div>
								</div>
							) : ''}

							{withType && type ? (
								<div className="relationItem cardType">
									{div}
									<div className="item">{type.name}</div>
								</div>
							) : ''}
						</div>

						{withCover ? (
							<div className="side right">
								<Cover 
									type={coverType} 
									id={coverId} 
									image={coverId} 
									className={coverId} 
									x={coverX} 
									y={coverY} 
									scale={coverScale} 
									withScale={true}
								/>
							</div>
						) : ''}
					</div>
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				className={cn.join(' ')} 
				tabIndex={0} 
				onKeyDown={this.onKeyDown} 
				onKeyUp={this.onKeyUp} 
				onFocus={this.onFocus}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
			>
				{element}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.rebind();
	};
	
	componentDidUpdate () {
		this.resize();
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();

		const node = $(this.node);
		node.on('resizeInit resizeMove', e => this.resize());
	};
	
	unbind () {
		if (!this._isMounted) {
			return;
		};
		
		$(this.node).off('resizeInit resizeMove');
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};
	
	onClick (e: any) {
		if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || e.button) {
			return;
		};

		const { rootId, block, dataset } = this.props;
		const { selection } = dataset || {};
		const { targetBlockId } = block.content;
		const object = detailStore.get(rootId, targetBlockId, []);
		const { _empty_ } = object;
		const ids = selection ? selection.get(I.SelectType.Block) : [];

		if (_empty_ || (targetBlockId == rootId)) {
			return;
		};
		
		if (!(keyboard.withCommand(e) && ids.length)) {
			UtilObject.openEvent(e, object);
		};
	};
	
	onSelect (icon: string) {
		const { block } = this.props;

		UtilObject.setIcon(block.content.targetBlockId, icon, '');
	};

	onUpload (hash: string) {
		const { block } = this.props;

		UtilObject.setIcon(block.content.targetBlockId, '', hash);
	};

	onCheckbox () {
		const { rootId, block } = this.props;
		const { targetBlockId } = block.content;
		const object = detailStore.get(rootId, targetBlockId, []);

		UtilObject.setDone(targetBlockId, !object.done);
	};

	onMouseEnter (e: React.MouseEvent) {
		const { rootId, block } = this.props;
		const { targetBlockId } = block.content;

		if (!targetBlockId) {
			return;
		};

		const object = detailStore.get(rootId, targetBlockId, []);
		if (object._empty_ || object.isDeleted) {
			return;
		};

		Preview.previewShow({ 
			rect: { x: e.pageX, y: e.pageY, width: 0, height: 0 }, 
			object,
			target: targetBlockId, 
			noUnlink: true,
			passThrough: true,
		});
	};

	onMouseLeave () {
		Preview.previewHide(true);
	};

	getIconSize () {
		const { rootId, block } = this.props;
		const object = detailStore.get(rootId, block.content.targetBlockId, [ 'layout' ], true);
		const content = UtilData.checkLinkSettings(block.content, object.layout);
		const { cardStyle } = content;

		let size = 20;
		let iconSize = 20;

		if ((cardStyle != I.LinkCardStyle.Text) && (content.iconSize == I.LinkIconSize.Medium)) {
			size = 48;
			iconSize = 28;
		};

		return { size, iconSize };
	};

	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			if (!this._isMounted) {
				return;
			};

			const { getWrapperWidth } = this.props;
			const node = $(this.node);
			const card = node.find('.linkCard');
			const icon = node.find('.iconObject');
			const rect = (node.get(0) as Element).getBoundingClientRect();
			const mw = getWrapperWidth();

			icon.length ? card.addClass('withIcon') : card.removeClass('withIcon');
			rect.width <= mw / 2 ? card.addClass('vertical') : card.removeClass('vertical');
		});
	};

});

export default BlockLink;