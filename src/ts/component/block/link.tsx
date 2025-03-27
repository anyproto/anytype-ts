import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, IconObject, Loader, ObjectName, Cover, Label } from 'Component';
import { I, S, U, J, translate, keyboard, focus, Preview } from 'Lib';

const BlockLink = observer(class BlockLink extends React.Component<I.BlockComponent> {
	
	_isMounted = false;
	node: any = null;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { rootId, block } = this.props;
		const object = S.Detail.get(rootId, block.getTargetObjectId(), J.Relation.cover);
		const { _empty_, isArchived, isDeleted, done, layout, coverId, coverType, coverX, coverY, coverScale } = object;
		const content = U.Data.checkLinkSettings(block.content, layout);
		const readonly = this.props.readonly || !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
		const { description, cardStyle, relations } = content;
		const { size, iconSize } = this.getIconSize();
		const type = S.Record.getTypeById(object.type);
		const cn = [ 'focusable', 'c' + block.id, 'resizable' ];

		const canDescription = !U.Object.isNoteLayout(object.layout);
		const withIcon = content.iconSize != I.LinkIconSize.None;
		const withType = relations.includes('type');
		const withCover = relations.includes('cover') && coverId && coverType;

		if (U.Object.isTaskLayout(layout) && done) {
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
					{...U.Common.dataProps({ 'target-block-id': object.id })}
				>
					<Loader type={I.LoaderType.Loader} />
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
			const cnc = [ 'linkCard', U.Data.layoutClass(object.id, layout), 'c' + size ];
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
			let onCardClick = null;
			let onNameClick = null;

			if (canDescription) {
				if (description == I.LinkDescription.Added) {
					descr = object.description;
				};
				if (description == I.LinkDescription.Content) {
					descr = object.snippet;
				};
			};

			if (isArchived) {
				archive = <div className="tagItem isMultiSelect archive">{translate('blockLinkArchived')}</div>;
			};

			if (cardStyle == I.LinkCardStyle.Text) {
				div = (
					<div className="div">
						<div className="inner" />
					</div>
				);
				onNameClick = this.onClick;
			} else {
				onCardClick = this.onClick;
			};

			if (withIcon) {
				const canEdit = !readonly && !isArchived && U.Object.isTaskLayout(object.layout);
				icon = (
					<IconObject 
						id={`block-${block.id}-icon`}
						size={size}
						iconSize={iconSize}
						object={object} 
						canEdit={canEdit} 
						noClick={canEdit}
					/>
				);
			};

			let n = 1;
			if (descr) n++;
			if (withType && type) n++;

			cnc.push('c' + n);

			element = (
				<div className={cnc.join(' ')} onClick={onCardClick}>
					<div id="sides" className={cns.join(' ')}>
						<div key="sideLeft" className={cnl.join(' ')}>
							<div className="relationItem cardName" onClick={onNameClick}>
								{icon}
								<ObjectName 
									object={object} 
									onMouseEnter={this.onMouseEnter} 
									onMouseLeave={this.onMouseLeave} 
									withLatex={true} 
									withPlural={true}
								/>
							</div>

							{descr ? (
								<div className="relationItem cardDescription">
									{div}
									<Label className="description" text={U.Common.getLatex(descr)} />
								</div>
							) : ''}

							{withType && type ? (
								<div className="relationItem cardType">
									{div}
									<div className="item">{type.name}</div>
								</div>
							) : ''}

							{archive}
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
		focus.set(this.props.block.id, { from: 0, to: 0 });
	};
	
	onClick (e: any) {
		if (e.button) {
			return;
		};

		const { rootId, block } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const { targetBlockId } = block.content;
		const object = S.Detail.get(rootId, targetBlockId, []);
		const ids = selection?.get(I.SelectType.Block) || [];

		if (object._empty_ || (targetBlockId == rootId) || (keyboard.withCommand(e) && ids.length)) {
			return;
		};

		U.Object.openEvent(e, object);
	};
	
	onMouseEnter (e: React.MouseEvent) {
		if (!this._isMounted) {
			return;
		};

		const { rootId, block } = this.props;
		const { targetBlockId, cardStyle } = block.content;

		if (!targetBlockId || (cardStyle != I.LinkCardStyle.Text)) {
			return;
		};

		const object = S.Detail.get(rootId, targetBlockId, []);
		if (object._empty_ || object.isDeleted) {
			return;
		};

		const node = $(this.node);
		const element = node.find('.cardName .name');

		Preview.previewShow({ 
			element, 
			object,
			target: targetBlockId, 
			noUnlink: true,
			noEdit: true,
			passThrough: true,
		});
	};

	onMouseLeave () {
		const { block } = this.props;
		const { targetBlockId, cardStyle } = block.content;

		if (!targetBlockId || (cardStyle != I.LinkCardStyle.Text)) {
			return;
		};

		Preview.previewHide(true);
	};

	getIconSize () {
		const { rootId, block } = this.props;
		const object = S.Detail.get(rootId, block.getTargetObjectId(), [ 'layout' ], true);
		const content = U.Data.checkLinkSettings(block.content, object.layout);
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
		window.setTimeout(() => {
			if (!this._isMounted) {
				return;
			};

			const { getWrapperWidth } = this.props;
			const node = $(this.node);
			const card = node.find('.linkCard');

			card.toggleClass('withIcon', !!node.find('.iconObject').length);
			card.toggleClass('isVertical', node.width() <= getWrapperWidth() / 2);
		});
	};

});

export default BlockLink;