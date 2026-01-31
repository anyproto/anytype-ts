import { useEffect } from 'react';

const useWindowEvent = (event: string, handler: EventListener, deps = []) => {                                                                                                                      
	useEffect(() => {
		window.addEventListener(event, handler);
		return () => window.removeEventListener(event, handler);
	}, deps);                                                                                                                                                                                         
};

export default useWindowEvent;