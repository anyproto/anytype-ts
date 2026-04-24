import React, { forwardRef, useEffect, useRef } from 'react';
import { Title, Label, Button, Textarea } from 'Component';
import * as I from 'Interface';

const PopupSubmitReport = forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { onSubmit } = data;
	const textareaRef = useRef(null);

	const onSubmitHandler = () => {
		const value = String(textareaRef.current?.getValue() || '').trim();

		close();
		onSubmit?.(value);
	};

	const onCancelHandler = () => {
		close();
	};

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	return (
		<div className="wrap">
			<Title text={translate('popupSubmitReportTitle')} />
			<Label text={translate('popupSubmitReportPrivacy')} />

			<div className="inputs">
				<Textarea
					ref={textareaRef}
					placeholder={translate('popupSubmitReportPlaceholder')}
					rows={5}
				/>
			</div>

			<div className="buttons">
				<Button
					text={translate('popupSubmitReportButton')}
					color="accent"
					size={36}
					onClick={onSubmitHandler}
				/>
				<Button
					text={translate('commonCancel')}
					color="blank"
					size={36}
					onClick={onCancelHandler}
				/>
			</div>
		</div>
	);

});

export default PopupSubmitReport;
