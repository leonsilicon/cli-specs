import { expect, test } from 'vitest'

import { defineCliExecutable } from '~/index.js'

test('default execa options can be lazy', () => {
	expect(() =>
		defineCliExecutable({
			executableName: 'foo',
			executablePath: 'foo',
			description: 'foo',
			defaultExecaOptions() {
				throw new Error('should not be thrown')
			},
		})
	).to.not.throw()
})
