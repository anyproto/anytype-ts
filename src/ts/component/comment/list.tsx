import React from 'react';
import { observer } from 'mobx-react';
import { I, S, U, translate } from 'Lib';
import CommentPost from './post';

interface Props {
	rootId: string;
	targetId: string;
	targetType: I.CommentTargetType;
	readonly?: boolean;
	onLoadMore?: () => void;
};

const CommentList = observer((props: Props) => {

	const { rootId, targetId, targetType, readonly, onLoadMore } = props;
	const subId = U.Comment.getSubId(targetType, targetId);
	const posts = S.Comment.getPosts(subId);
	const hasMore = S.Comment.getHasMorePosts(subId);

	if (!posts.length) {
		return null;
	};

	return (
		<div className="commentList">
			{hasMore ? (
				<div className="loadMore" onClick={onLoadMore}>
					{translate('commentLoadMore')}
				</div>
			) : ''}

			{posts.map(post => (
				<CommentPost
					key={post.id}
					rootId={rootId}
					targetId={targetId}
					message={post}
					readonly={readonly}
				/>
			))}
		</div>
	);
});

export default CommentList;
