import fs from 'node:fs'

import boxen from 'boxen'
import { deepmerge } from 'deepmerge-ts'
import type { ExecaChildProcess, Options as ExecaOptions } from 'execa'
import { execa } from 'execa'
import onetime from 'onetime'
import renameFunction from 'rename-fn'
import shellQuote from 'shell-quote'
import type { Promisable, Writable } from 'type-fest'

import type { CliExecutable } from '~/types/cli.js'

export function defineCliExecutable<
	// eslint-disable-next-line @typescript-eslint/ban-types
	ExtraOptions extends Record<string, unknown> = {}
>(args: {
	executableName: string
	executablePath: string | (() => string)
	description: string
	defaultExecaOptions: Partial<ExecaOptions> | (() => Partial<ExecaOptions>)
	augmentArguments?(
		args: string[],
		options?: ExecaOptions & ExtraOptions
	): string[]
	runCommand?(
		args: string[],
		options?: ExecaOptions & ExtraOptions
	): { process: ExecaChildProcess } | Promise<{ process: ExecaChildProcess }>
	exists?(): Promisable<boolean>
	install?(): Promisable<void>
}): CliExecutable<ExtraOptions> {
	let _doesCliToolExist = false
	const doesCliToolExist = onetime(
		args.exists ??
			(() => {
				const executablePath =
					typeof args.executablePath === 'function'
						? args.executablePath()
						: args.executablePath
				return fs.existsSync(executablePath)
			})
	)

	const cliExecutable_getProcess = async (
		command: string | string[],
		options?: ExecaOptions & ExtraOptions
	) => {
		const executablePath =
			typeof args.executablePath === 'function'
				? args.executablePath()
				: args.executablePath

		if (!_doesCliToolExist && !doesCliToolExist()) {
			if (args.install === undefined) {
				process.stderr.write(
					boxen(args.description, {
						textAlignment: 'center',
						margin: 1,
						padding: 1,
					})
				)
				throw new Error(`Missing CLI executable: ${executablePath}`)
			} else {
				try {
					await args.install()
					_doesCliToolExist = true
				} catch (error: any) {
					process.stderr.write(
						boxen(args.description, {
							textAlignment: 'center',
							margin: 1,
							padding: 1,
						})
					)

					throw new Error(
						`Failed to install CLI executable: ${error.message as string}`
					)
				}
			}
		}

		let execaArguments = [
			...(Array.isArray(command)
				? command
				: (shellQuote.parse(command) as string[])),
		]

		const defaultExecaOptions = (
			typeof args.defaultExecaOptions === 'function'
				? args.defaultExecaOptions()
				: args.defaultExecaOptions
		) as Writable<ExecaOptions>
		if (
			(defaultExecaOptions.stdout !== undefined ||
				defaultExecaOptions.stderr !== undefined ||
				defaultExecaOptions.stdin !== undefined) &&
			options?.stdio !== undefined
		) {
			delete defaultExecaOptions.stdout
			delete defaultExecaOptions.stderr
			delete defaultExecaOptions.stdin
		}

		const execaOptions = deepmerge(
			args.defaultExecaOptions,
			options
		) as ExecaOptions & ExtraOptions

		if (args.augmentArguments !== undefined) {
			execaArguments = args.augmentArguments(execaArguments, execaOptions)
		}

		let execaProcess: ExecaChildProcess
		if (args.runCommand === undefined) {
			execaProcess = execa(executablePath, execaArguments, execaOptions)
		} else {
			;({ process: execaProcess } = await args.runCommand(
				execaArguments,
				execaOptions
			))
		}

		return { process: execaProcess }
	}

	/**
		If called directly, it waits for the command to complete before resolving.

		@example ```
			await cliTool(...args)
		```

		Note that we need to return an object because execa returns a promise-like value, so if we didn't, the await would also apply to the execa return value and would only resolve once the process was completed.

		@example ```
			const { process } = await cliTool.getProcess(...args)
		```
	*/
	const cliTool = async (
		command: string | string[],
		options?: ExecaOptions & ExtraOptions
	) => {
		const { process } = await cliExecutable_getProcess(command, options)
		const result = await process
		return result
	}

	renameFunction(cliTool, args.executableName)

	return Object.assign(cliTool, {
		getProcess: cliExecutable_getProcess,
		exists: doesCliToolExist,
		getExecutablePath:
			typeof args.executablePath === 'function'
				? args.executablePath
				: () => args.executablePath,
		executableName: args.executableName,
		description: args.description,
		install: args.install,
	}) as any
}
