{
	'targets': [
		{
			'target_name': 'pipe',
			'sources': [ 'pipe.c' ],
			'libraries': [ '<!(pwd)/lib.so' ]
		}
	]
}