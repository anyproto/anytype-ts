import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconObject, Cover } from 'ts/component';
import { I, M, DataUtil, translate } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent, RouteComponentProps<any> {
    withName?: boolean;
    withIcon?: boolean;
    withCover?: boolean;
    withDescription?: boolean;
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
Size[I.LinkIconSize.Small] = 24;
Size[I.LinkIconSize.Medium] = 64;
Size[I.LinkIconSize.Large] = 96;


const LinkCard = observer(class LinkCard extends React.Component<Props, {}> {

	render () {
        const { rootId, block, withName, withIcon, withDescription, iconSize, object, className, canEdit, onClick, onSelect, onUpload, onCheckbox } = this.props;
        const { id, layout, coverType, coverId, coverX, coverY, coverScale, snippet } = object;
        const { align, bgColor } = block;
        const cn = [ 'linkCard', 'align' + align, DataUtil.layoutClass(id, layout), 'c' + Size[iconSize] ];
        const cns = [ 'sides' ];
        const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, align: align, childrenIds: [], fields: {}, content: {} });
        const withCover = this.props.withCover && coverId && coverType;

        let name = object.name || DataUtil.defaultName('page');
        let description = '';
		if (layout == I.ObjectLayout.Note) {
			name = snippet || <span className="empty">Empty</span>;
		} else {
			description = object.description || object.snippet;
		};

        if (className) {
            cn.push(className);
        };
        if (withCover) {
            cn.push('withCover');
        };

        if (bgColor) {
			cns.push('bgColor bgColor-' + bgColor);
		};
        if (!withIcon && !withName && !withDescription) {
            cns.push('hidden');
        };

        let sideLeft = null;

        if (withIcon) {
            sideLeft = (
                <div key="sideLeft" className="side left">
                    <IconObject 
                        id={`block-${block.id}-icon`}
                        size={Size[iconSize]} 
                        object={object} 
                        canEdit={canEdit} 
                        onSelect={onSelect} 
                        onUpload={onUpload} 
                        onCheckbox={onCheckbox} 
                    />
                </div>
            );
        };

        let sideRight = (
            <div key="sideRight" className="side right">
                <div className="txt">
                    {withName ? <div className="cardName"><span>{name}</span></div> : ''}
                    {withDescription ? <div className="cardDescription">{description || snippet}</div> : ''}
                    <div className="archive">{translate('blockLinkArchived')}</div>

                    {/*<Block {...this.props} rootId={block.content.targetBlockId} iconSize={18} block={featured} readonly={true} className="noPlus" />*/}
                </div>
            </div>
        );

        let content = (
            <div id="sides" className={cns.join(' ')}>
                {align == I.BlockAlign.Right ? (
                    <React.Fragment>
                        {sideRight}
                        {sideLeft}
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        {sideLeft}
                        {sideRight}
                    </React.Fragment>
                )}
            </div>
        );

		return (
			<div className={cn.join(' ')} onMouseDown={onClick}>
                {withCover ? (
                    <Cover 
                        type={coverType} 
                        id={coverId} 
                        image={coverId} 
                        className={coverId} 
                        x={coverX} 
                        y={coverY} 
                        scale={coverScale} 
                        withScale={true}
                    >
                        {content}
                    </Cover>
                ) : (
                    <React.Fragment>
                        {content}
                    </React.Fragment>
                )}
			</div>
		);
	};

});

export default LinkCard;