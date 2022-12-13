import type {
	ExecaChildProcess,
	ExecaReturnValue,
	Options as ExecaOptions,
} from 'execa'
import type { Promisable } from 'type-fest'

export interface CliTool<
	ExtraOptions extends Record<string, unknown> = Record<string, unknown>
> {
	(
		command: string | string[],
		options?: ExecaOptions & ExtraOptions
	): Promise<ExecaReturnValue>
	commandName: string
	description: string
	exists(): Promisable<boolean>
	install(): Promisable<void>
	getProcess(
		command: string | string[],
		options?: ExecaOptions & ExtraOptions
	): Promise<{ process: ExecaChildProcess }>
}
