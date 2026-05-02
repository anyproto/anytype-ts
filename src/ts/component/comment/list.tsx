import React, { useState, useCallback } from 'react';
import CommentPost from './post';
import * as I from 'Interface';

interface Props {
	rootId: string;
	targetId: string;
	targetType: I.CommentTargetType;
	readonly?: boolean;
	onLoadMore?: (callBack: () => void) => void;
};

const CommentList = (props: Props) => {

	const { rootId, targetId, targetType, readonly, onLoadMore } = props;
	const subId = U.Comment.getSubId(targetType, targetId);
	const posts = S.Comment.getPosts(subId);
	const hasMore = S.Comment.getHasMorePosts(subId);
	const [ isLoadingMore, setIsLoadingMore ] = useState(false);

	const handleLoadMore = useCallback(() => {
		if (isLoadingMore) {
			return;
		};

		setIsLoadingMore(true);
		onLoadMore?.(() => setIsLoadingMore(false));
	}, [ isLoadingMore, onLoadMore ]);

	return (
		<div className="commentPosts">
			{hasMore ? (
				<div
					className={[ 'loadMore', (isLoadingMore ? 'isLoading' : '') ].join(' ')}
					onClick={handleLoadMore}
				>
					{isLoadingMore ? translate('commentLoading') : translate('commentLoadMore')}
				</div>
			) : null}

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
