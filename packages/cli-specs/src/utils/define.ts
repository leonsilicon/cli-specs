import boxen from 'boxen'
import commandExists from 'command-exists'
import { deepmerge } from 'deepmerge-ts'
import type { ExecaChildProcess, Options as ExecaOptions } from 'execa'
import { execa } from 'execa'
import onetime from 'onetime'
import renameFunction from 'rename-fn'
import shellQuote from 'shell-quote'
import type { Promisable, Writable } from 'type-fest'

import type { CliTool } from '~/types/cli.js'

export function defineCliTool<
	// eslint-disable-next-line @typescript-eslint/ban-types
	ExtraOptions extends Record<string, unknown> = {}
>(args: {
	commandName: string
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
}): CliTool<ExtraOptions> {
	let _doesCliToolExist = false
	const doesCliToolExist = onetime(
		args.exists ?? (() => commandExists.sync(args.commandName))
	)

	const cliTool_getProcess = async (
		command: string | string[],
		options?: ExecaOptions & ExtraOptions
	) => {
		if (!_doesCliToolExist && !doesCliToolExist()) {
			if (args.install === undefined) {
				process.stderr.write(
					boxen(args.description, {
						textAlignment: 'center',
						margin: 1,
						padding: 1,
					})
				)
				throw new Error(`Missing CLI tool: ${args.commandName}`)
			} else {
				try {
					await args.install()
					_doesCliToolExist = true
				} catch {
					process.stderr.write(
						boxen(args.description, {
							textAlignment: 'center',
							margin: 1,
							padding: 1,
						})
					)
					throw new Error(`Missing CLI tool: ${args.commandName}`)
				}
			}
		}

		let execaArguments = [
			...(Array.isArray(command)
				? command
				: (shellQuote.parse(command) as string[])),
		]

		let defaultExecaOptions = (typeof args.defaultExecaOptions === 'function' ? args.defaultExecaOptions() : args.defaultExecaOptions) as Writable<ExecaOptions>
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
			execaProcess = execa(args.commandName, execaArguments, execaOptions)
		} else {
			; ({ process: execaProcess } = await args.runCommand(
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
		const { process } = await cliTool_getProcess(command, options)
		const result = await process
		return result
	}

	renameFunction(cliTool, args.commandName)

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return Object.assign(cliTool, {
		getProcess: cliTool_getProcess,
		exists: doesCliToolExist,
		commandName: args.commandName,
		description: args.description,
		install: args.install,
	}) as any
}
