import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconObject, Cover } from 'ts/component';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent, RouteComponentProps<any> {
    withIcon?: boolean;
    withCover?: boolean;
    iconSize: number;
    object: any;
    className?: string;
};

const LinkCard = observer(class LinkCard extends React.Component<Props, {}> {

	render () {
        const { withIcon, withCover, object, className } = this.props;
        const { id, layout, coverType, coverId, coverX, coverY, coverScale, name, description } = object;
        const cn = [ 'linkCard', DataUtil.layoutClass(id, layout) ];

        if (className) {
            cn.push(className);
        };
        if (withCover && coverId && coverType) {
            cn.push('withCover');
        };

        let iconSize = this.props.iconSize;
        if (layout == I.ObjectLayout.Task) {
            iconSize = 16;
        };

        cn.push('c' + iconSize);

        let content = (
            <div className="sides">
                {withIcon ? (
                    <div className="side left">
                        <IconObject size={iconSize} object={object} />
                    </div>
                ) : ''}
                <div className="side right">
                    <div className="name">{name}</div>
                    <div className="descr">{description}</div>
                </div>
            </div>
        );

		return (
			<div className={cn.join(' ')}>
                {withCover && coverId && coverType ? (
                    <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true}>
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