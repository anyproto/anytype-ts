import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconObject, Cover, ObjectName } from 'Component';
import { I, DataUtil, translate } from 'Lib';
import { dbStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent, RouteComponentProps<any> {
    description?: number;
    iconSize: number;
	cardStyle: number;
	relations: string[];
    object: any;
    className?: string;
    canEdit?: boolean;
    onSelect?(id: string): void;
	onUpload?(hash: string): void;
	onCheckbox?(e: any): void;
    onClick?(e: any): void;
};

const Constant = require('json/constant.json');

const LinkCard = observer(class LinkCard extends React.Component<Props, {}> {

	render () {
        const { rootId, block, description, cardStyle, object, className, canEdit, onClick, onSelect, onUpload, onCheckbox } = this.props;
        const { id, layout, coverType, coverId, coverX, coverY, coverScale, snippet, isArchived, isDeleted } = object;
		const { size, iconSize } = this.getIconSize();
		const canDescription = ![ I.ObjectLayout.Note ].includes(object.layout);
		const type = dbStore.getType(object.type);
		const withIcon = this.props.iconSize != I.LinkIconSize.None;
		const withType = this.hasRelationKey('type');
        const withCover = this.hasRelationKey('cover') && coverId && coverType;
		const cn = [ 'linkCard', DataUtil.layoutClass(id, layout), 'c' + size, DataUtil.linkCardClass(cardStyle) ];
        const cns = [ 'sides' ];
		const cnl = [ 'side', 'left' ];
		
        if (className) {
            cn.push(className);
        };
        if (withCover) {
            cn.push('withCover');
        };

		if (block.bgColor) {
			cns.push('withBgColor');
			cnl.push('bgColor bgColor-' + block.bgColor);
		};

		let descr = '';
		let archive = null;

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

		return (
			<div className={cn.join(' ')} onMouseDown={onClick}>
				<div id="sides" className={cns.join(' ')}>
					<div key="sideLeft" className={cnl.join(' ')}>
						<div className="txt">
							<div className="cardName">
								{withIcon ? (
									<IconObject 
										id={`block-${block.id}-icon`}
										size={size}
										iconSize={iconSize}
										object={object} 
										canEdit={canEdit} 
										onSelect={onSelect} 
										onUpload={onUpload} 
										onCheckbox={onCheckbox} 
									/>
								) : ''}
								<ObjectName object={object} />

								{archive}
							</div>
							{descr ? <div className="cardDescription">{descr}</div> : ''}

							<div className="cardFeatured">
								{withType && type ? <div className="item">{type.name}</div> : ''}
								{/*withTags ? <div className="item"></div> : ''*/}
							</div>
						</div>
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

	getIconSize () {
		const { cardStyle } = this.props;

		let size = 24;
		let iconSize = 0;

		if (cardStyle != I.LinkCardStyle.Text) {
			switch (this.props.iconSize) {
				default:
					size = 18;
					break;

				case I.LinkIconSize.Medium:
					size = 48;
					iconSize = 28;
					break;
			};
		};

		return { size, iconSize };
	};

	hasRelationKey (key: string) {
		return this.props.relations.includes(key);
	};

});

export default LinkCard;