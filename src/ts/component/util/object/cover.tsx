import React, { FC } from 'react';
import { Cover, MediaAudio, MediaVideo } from 'Component';
import { I, S, U } from 'Lib';

interface Props {
	object: any;
	isPopup?: boolean;
};

const ObjectCover: FC<Props> = ({ 
	object = {},
	isPopup = false,
}) => {
	object = object || {};

	if (!object) {
		return null;
	};

	const { id, name, layout, coverType, coverId, coverX, coverY, coverScale } = object;
	const cn = [ 'cover', `type${I.CoverType.Upload}` ];

	let content = null;
	if (coverId && coverType) {
		content = (
			<Cover
				type={coverType}
				id={coverId}
				image={coverId}
				className={coverId}
				x={coverX}
				y={coverY}
				scale={coverScale}
				withScale={false}
			/>
		);
	} else {
		switch (layout) {
			case I.ObjectLayout.Image: {
				cn.push('coverImage');
				content = <img src={S.Common.imageUrl(id, I.ImageSize.Large)} onDragStart={e => e.preventDefault()} />;
				break;
			};

			case I.ObjectLayout.Audio: {
				cn.push('coverAudio');
				content = (
					<MediaAudio 
						playlist={[ 
							{ name: U.File.name(name), src: S.Common.fileUrl(id) },
						]} 
						getScrollContainer={() => U.Common.getScrollContainer(isPopup)} 
					/>
				);
				break;
			};

			case I.ObjectLayout.Video: {
				cn.push('coverVideo');
				content = <MediaVideo src={S.Common.fileUrl(id)}/>;
				break;
			};
		};
	};

	return content ? <div className={cn.join(' ')}>{content}</div> : null;
};

export default ObjectCover;