import HTML5Backend from 'react-dnd-html5-backend';

let sort = (c1: any, c2: any) => {
	let n1 = c1.name.toLowerCase();
	let n2 = c2.name.toLowerCase();
	if (n1 > n2) return 1;
	if (n1 < n2) return -1;
	return 0;
};

let getFiles = (e: any) => {
	let root = { name: 'root', folders: [] as any[], files: [] as any[], folderCnt: 0, fileCnt: 0 };
	let items = e.dataTransfer.items;
	
	let readFile = (item: any, parent: any) => {
		if (!item) {
			return;
		};
		
		return new Promise((resolve: any) => {
			if (item.isFile) {
				item.file((file: any) => {
					parent.files.push(file);
					parent.files.sort(sort);
					
					root.fileCnt++;
					resolve(file);
				});
			} else
			if (item.isDirectory) {
				let reader = item.createReader();
				reader.readEntries((entries: any) => {
					let promises = [];
					
					let folder = {
						name: item.name,
						folders: [] as any[],
						files: [] as any[]
					};
					
					for (let entry of entries) {
						let promise = readFile(entry, folder);
						if (promise) {
							promises.push(promise);
						};
					};
					
					Promise.all(promises).then((entries: any) => {
						if (parent) {
							parent.folders.push(folder);
							parent.folders.sort(sort);
						} else {
							folder.folders.push(folder);
							folder.folders.sort(sort);
						};
						
						root.folderCnt++;
						resolve(folder);
					});
				});
			};
		});
	};
	
	return new Promise((resolve: any, reject: any) => {
		let promises = [];
		
		for (let item of items) {
			let promise = readFile(item.webkitGetAsEntry(), root);
			if (promise) {
				promises.push(promise);
			};
		};
		
		Promise.all(promises).then((entries: any) => {
			root.files.sort(sort);
			root.folders.sort(sort);
			resolve(root);
		});
	});
};

export default (manager: any) => {
	const backend: any = HTML5Backend(manager);
	const orgTopDropCapture = backend.handleTopDropCapture;
	
	backend.handleTopDropCapture = (e: any) => {
		orgTopDropCapture.call(backend, e);
		if (backend.currentNativeSource) {
			backend.currentNativeSource.item.dirContent = getFiles(e);
		};
	};
	
	return backend;
};