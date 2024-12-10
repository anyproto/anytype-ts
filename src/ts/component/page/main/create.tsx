import React, { forwardRef, useEffect } from 'react';
import { Loader, Frame } from 'Component';
import { I, U } from 'Lib';

const PageMainCreate = forwardRef<{}, I.PageComponent>((props, ref) => {

	useEffect(() => {
		const flags = [ I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectType ];
		U.Object.create('', '', {}, I.BlockPosition.Bottom, '', flags, '', message => U.Object.openRoute(message.details));
	}, []);

	return (
		<Frame>
			<Loader id="loader" />
		</Frame>
	);

});

export default PageMainCreate;