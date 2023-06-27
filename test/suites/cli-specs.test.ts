import { expect, test } from 'vitest'

import { defineCliTool } from '~/index.js'

test('default execa options can be lazy', () => {
	expect(() =>
		defineCliTool({
			commandName: 'foo',
			description: 'foo',
			defaultExecaOptions() {
				throw new Error('should not be thrown')
			},
		})
	).to.not.throw()
})
