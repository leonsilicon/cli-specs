# cli-specs

`cli-specs` is a utility for defining CLI tools that should be called from JavaScript.

## Usage

Install `cli-specs` using your favorite package manager:

```sh
npm install cli-specs
```

Then, import and use `cli-specs` in your project like in the following example:

```javascript
import { defineCliTool, installHomebrewPackage } from 'cli-specs'
import { outdent } from 'outdent'

const git = defineCliTool({
  commandName: 'git',
  description: outdent`
    \`git\` is the version control system that is needed
    for Dialect development.
  `,
  install: async () => installHomebrewPackage('git'),
  defaultExecaOptions: {
    stdout: 'inherit',
    stderr: 'inherit'
  }
})

await git(['add', '.'])
```
