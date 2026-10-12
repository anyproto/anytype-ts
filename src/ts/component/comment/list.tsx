import React from 'react';
import CommentPost from './post';
import * as I from 'Interface';

interface Props {
	rootId: string;
	targetId: string;
	targetType: I.CommentTargetType;
	readonly?: boolean;
};

const CommentList = (props: Props) => {

	const { rootId, targetId, targetType, readonly } = props;
	const subId = U.Comment.getSubId(targetType, targetId);
	const posts = S.Comment.getPosts(subId);

	return (
		<div className="commentPosts">
			{posts.map((post, i) => (
				<CommentPost
					key={post.id}
					rootId={rootId}
					targetId={targetId}
					message={post}
					readonly={readonly}
					isLast={i === posts.length - 1}
				/>
			))}
		</div>
	);
};

export default CommentList;
