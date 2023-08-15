import type {
	ExecaChildProcess,
	ExecaReturnValue,
	Options as ExecaOptions,
} from 'execa'
import type { Promisable } from 'type-fest'

export interface CliExecutable<
	// eslint-disable-next-line @typescript-eslint/ban-types
	ExtraOptions extends Record<string, unknown> = {}
> {
	(
		command: string | string[],
		options?: ExecaOptions & ExtraOptions
	): Promise<ExecaReturnValue>
	description: string
	executableName: string
	exists(): Promisable<boolean>
	install(): Promisable<void>
	getProcess(
		command: string | string[],
		options?: ExecaOptions & ExtraOptions
	): Promise<{ process: ExecaChildProcess }>
	getExecutablePath(): Promisable<string>
}
