import { execa } from 'execa'
import { got } from 'got'
import { outdent } from 'outdent'

import { defineCliTool } from '~/utils/define.js'

export const homebrew = defineCliTool({
	commandName: 'brew',
	description: outdent`
		\`homebrew\` is a package manager for macOS that manages dependencies.
		https://brew.sh/
	`,
	defaultExecaOptions: {
		stdout: 'inherit',
		stderr: 'inherit',
	},
	/**
		Taken from "Install Homebrew" at https://brew.sh and ported to JavaScript.
	*/
	async install() {
		const response = await got.get(
			'https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh'
		)
		await execa('/bin/bash', ['-c', response.body], {
			stdio: 'inherit',
		})
	},
})

export async function installHomebrewPackage(formulaName: string) {
	await homebrew(['update'], { stdio: 'inherit' })
	await homebrew(['install', formulaName], { stdio: 'inherit' })
}
