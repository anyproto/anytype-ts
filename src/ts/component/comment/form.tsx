import React, { forwardRef, useRef, useState, useImperativeHandle, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, translate } from 'Lib';
import CommentEditor from 'Component/form/commentEditor';

interface Props {
	rootId: string;
	placeholder?: string;
	initialParts?: I.CommentContentPart[];
	isEdit?: boolean;
	readonly?: boolean;
	onSubmit?: (parts: I.CommentContentPart[]) => void;
	onCancel?: () => void;
};

interface RefProps {
	focus: () => void;
	clear: () => void;
};

const CommentForm = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { placeholder, initialParts, isEdit, readonly, onSubmit, onCancel } = props;
	const editorRef = useRef<any>(null);
	const [ isEmpty, setIsEmpty ] = useState(true);

	useImperativeHandle(ref, () => ({
		focus: () => editorRef.current?.focus(),
		clear: () => {
			editorRef.current?.clear();
			setIsEmpty(true);
		},
	}));

	const handleSubmit = useCallback((parts: I.CommentContentPart[]) => {
		onSubmit?.(parts);
		if (!isEdit) {
			editorRef.current?.clear();
			setIsEmpty(true);
		};
	}, [ onSubmit, isEdit ]);

	const handleEmpty = useCallback((v: boolean) => {
		setIsEmpty(v);
	}, []);

	if (readonly) {
		return null;
	};

	const cn = [ 'commentForm' ];

	if (isEdit) {
		cn.push('isEdit');
	};

	return (
		<div className={cn.join(' ')}>
			<div className="editorWrap">
				<CommentEditor
					ref={editorRef}
					placeholder={placeholder || translate('commentPlaceholder')}
					initialParts={initialParts}
					onSubmit={handleSubmit}
					onCancel={onCancel}
					onEmpty={handleEmpty}
				/>
			</div>

			<div className="buttons">
				{isEdit && onCancel ? (
					<div className="btn cancel" onClick={onCancel}>
						{translate('commonCancel')}
					</div>
				) : ''}

				<div
					className={[ 'btn', 'send', (isEmpty ? 'disabled' : '') ].join(' ')}
					onClick={() => {
						if (!isEmpty) {
							const parts = editorRef.current?.getParts();
							if (parts) {
								handleSubmit(parts);
							};
						};
					}}
				>
					<Icon className="send" />
				</div>
			</div>
		</div>
	);
}));

export default CommentForm;
