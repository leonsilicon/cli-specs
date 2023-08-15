# cli-specs

`cli-specs` is a utility for defining CLI executables that should be called from JavaScript.

## Usage

Install `cli-specs` using your favorite package manager:

```sh
npm install cli-specs
```

Then, import and use `cli-specs` in your project like in the following example:

```javascript
import { defineCliExecutable } from 'cli-specs'
import { outdent } from 'outdent'

const git = defineCliExecutable({
  executableName: 'git',
  executablePath: '/usr/bin/git',
  description: outdent`
    \`git\` is the version control system that is needed
    for development.
  `,
  defaultExecaOptions: {
    stdout: 'inherit',
    stderr: 'inherit'
  }
})

await git(['add', '.'])
```
