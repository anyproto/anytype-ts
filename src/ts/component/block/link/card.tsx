import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconObject, Cover, ObjectName, ObjectDescription } from 'ts/component';
import { I, M, DataUtil, translate } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent, RouteComponentProps<any> {
    withName?: boolean;
    withIcon?: boolean;
    withCover?: boolean;
    description?: number;
    iconSize: number;
    object: any;
    className?: string;
    canEdit?: boolean;
    onSelect?(id: string): void;
	onUpload?(hash: string): void;
	onCheckbox?(e: any): void;
    onClick?(e: any): void;
};

const Size: any = {};
Size[I.LinkIconSize.Small] = 18;
Size[I.LinkIconSize.Medium] = 48;

const LinkCard = observer(class LinkCard extends React.Component<Props, {}> {

	render () {
        const { rootId, block, withName, withIcon, description, iconSize, object, className, canEdit, onClick, onSelect, onUpload, onCheckbox } = this.props;
        const { id, layout, coverType, coverId, coverX, coverY, coverScale, snippet } = object;
        const { bgColor } = block;
        const cn = [ 'linkCard', DataUtil.layoutClass(id, layout), 'c' + Size[iconSize] ];
        const cns = [ 'sides' ];
        const withCover = this.props.withCover && coverId && coverType;
		const canDescription = ![ I.ObjectLayout.Note ].includes(object.layout);

        if (className) {
            cn.push(className);
        };
        if (withCover) {
            cn.push('withCover');
        };

        if (bgColor) {
			cns.push('bgColor bgColor-' + bgColor);
		};
        if (!withIcon && !withName && (description == I.LinkDescription.None)) {
            cns.push('hidden');
        };

		let descr = '';
		if (description == I.LinkDescription.Added) {
			descr = canDescription ? object.description : '';
		};
		if (description == I.LinkDescription.Content) {
			descr = canDescription ? (object.description || object.snippet) : '';
		};

		return (
			<div className={cn.join(' ')} onMouseDown={onClick}>
				<div id="sides" className={cns.join(' ')}>
					<div key="sideLeft" className="side left">
						<div className="txt">
							<div className="cardName">
								{withIcon ? (
									<IconObject 
										id={`block-${block.id}-icon`}
										size={Size[iconSize] || Size[I.LinkIconSize.Small]} 
										object={object} 
										canEdit={canEdit} 
										onSelect={onSelect} 
										onUpload={onUpload} 
										onCheckbox={onCheckbox} 
									/>
								) : ''}
								{withName ? <ObjectName object={object} /> : ''}
							</div>
							{descr ? <div className="cardDescription">{descr}</div> : ''}
							<div className="archive">{translate('blockLinkArchived')}</div>
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

});

export default LinkCard;