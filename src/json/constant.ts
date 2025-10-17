export default {
	sentry:				 'https://44e6df81644c4e36b21b1dbea62b8a1a@sentry.anytype.io/3',
	amplitude:			 '1ba981d1a9afb8af8c81847ef3383a20',
	googleMaps:			 'AIzaSyAgXu3wCb6mPJv4wNWKe2E3YycaYuqFm9o',
	protocol:			 'anytype',
	appName:			 'Anytype',
	anytypeProfileId:	 '_anytype_profile',
	fontCode:			 'plex',
	popupPinIds:		 [ 'search' ],
	textColor:			 [ 'grey', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'ice', 'teal', 'lime' ],
	namespace:			 { 0: '.any' },

	allowedSchemes:		 [ 'http', 'https', 'mailto', 'tel' ],

	count: {
		icon:			 10,
		phrase:			 { letter: 8, word: 12 }
	},
	
	networkId: {
		production:		 'N83gJpVd9MuNRZAuJLZ7LiMntTThhPc6DtzWWVjb1M3PouVU',
		development:	 'N9DU6hLkTAbvcpji3TCKPPd3UQWKGyzUxGmgJEyvhByqAjfD',
		testing:		 'N4N1wDHFpFpovXBqdbq2TDXE9tXdXbtV1eTJFpKJW4YeaJqR'
	},

	platforms: {
		win32:			 'Windows',
		darwin:			 'Mac',
		linux:			 'Linux'
	},

	limit: {
		menuRecords:	 	 			 100,
		notification:	 	 			 20,
		graphDepth:		 	 			 5,
		cellEntry:		 	 			 320,
		listObject:		 	 			 50,
		tableOfContents:	 			 50,

		space: {
			count:						 50,
			name:						 50,
			description:				 200,
			nameThreshold:				 10,
			descriptionThreshold:		 50,
			pin:						 6, 
		},

		chat: {
			messages:					 50,
			attachments:				 10,
			files:						 10,
			mentions:					 10,
			text:						 2000,
			reactions: {
				self:					 3,
				all:					 12,
			},
		},

		relation: {
			option: 4,
		},
	},

	default: {
		interfaceLang:	 'en-US',
		spellingLang:	 'en',
		codeLang:		 'plain',
		typeKey:		 'ot-page',
		pinTime:		 600,
	},

	delay: {
		menu:			 150,
		popup:			 150,
		toast:			 2500,
		route:			 200,
		keyboard:		 500,
		notification:	 200,
		widget:			 400,
		widgetItem:		 200,
		sidebar:		 200,
		highlight:  	 1000,
		chatHistory:	 500,
		chatMessage:	 200,
	},

	fileExtension: {
		image:			 [ 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp' ],
		video:			 [ 'mp4', 'm4v', 'mov' ],
		cover:			 [ 'jpg', 'jpeg', 'png', 'gif', 'webp' ],
		audio:			 [ 'mp3', 'm4a', 'flac', 'ogg', 'wav' ],
		pdf:			 [ 'pdf' ],
		import: {
			1:			 [ 'zip', 'md' ],
			3:			 [ 'zip', 'pb', 'json' ],
			4:			 [ 'zip', 'html', 'htm', 'mhtml' ],
			5:			 [ 'zip', 'txt' ],
			6:			 [ 'zip', 'csv' ],
		},
	},

	graphId: {
		global:			 'graphGlobal',
		dataview:		 'graphDataview'
	},

	subId: {
		search:			 		'search',
		profile:		 		'profile',
		deleted:		 		'deleted',
		archived:		 		'archived',
		type:			 		'type',
		typeStore:		 		'typeStore',
		relation:		 		'relation',
		relationStore:	 		'relationStore',
		option:			 		'option',
		store:			 		'store',
		archive:		 		'archive',
		sidebar:		 		'sidebar',
		space:			 		'space',
		participant:	 		'participant',
		subSpace:		 		'subSpace',
		library: 		 		'library',
		chatSpace:		 		'lastMessage',
		template:		 		'template',
		fileManagerSynced: 		'fileManagerSynced',
		fileManagerNotSynced: 	'fileManagerNotSynced',
		chatPreview:	 		'chatPreview',
	},

	typeKey: {
		page:			 'ot-page',
		set:			 'ot-set',
		space:			 'ot-space',
		spaceview:		 'ot-spaceView',
		template:		 'ot-template',
		type:			 'ot-objectType',
		image:			 'ot-image',
		file:			 'ot-file',
		video:			 'ot-video',
		audio:			 'ot-audio',
		relation:		 'ot-relation',
		note:			 'ot-note',
		task:			 'ot-task',
		bookmark:		 'ot-bookmark',
		option:			 'ot-relationOption',
		collection:		 'ot-collection',
		dashboard:		 'ot-dashboard',
		date:			 'ot-date',
		profile:		 'ot-profile',
		chat:			 'ot-chat',
		chatDerived:	 'ot-chatDerived',
		project:		 'ot-project',
		human:			 'ot-human',
		participant:	 'ot-participant',
	},

	templateId: {
		new:			 'newTemplate'
	},

	blockId: {
		title:			 'title',
		description:	 'description',
		featured:		 'featuredRelations',
		dataview:		 'dataview',
		type:			 'type',
		header:			 'header',
		chat:			 'chat',
	},

	widgetId: {
		allObject:		 'allObject',
		favorite:		 'favorite',
		recentEdit:		 'recent',
		recentOpen:		 'recentOpen',
		bin:			 'bin',
		chat:			 'chat',
	},

	monthDays: {
		1:				 31,
		2:				 28,
		3:				 31,
		4:				 30,
		5:				 31,
		6:				 30,
		7:				 31,
		8:				 31,
		9:				 30,
		10:				 31,
		11:				 30,
		12:				 31
	},

	mcpConfig: `
		{
			"mcpServers": {
				"anytype": {
					"command": "npx",
					"args": ["-y", "@anyproto/anytype-mcp"],
					"env": {
						"OPENAPI_MCP_HEADERS": "{\\"Authorization\\":\\"Bearer %s\\", \\"Anytype-Version\\":\\"2025-05-20\\"}"
					}
				}
			}
		}
	`,

};
