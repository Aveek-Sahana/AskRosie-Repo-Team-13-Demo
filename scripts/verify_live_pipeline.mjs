import { spawn } from 'node:child_process'

const origin = process.env.ROSIE_ORIGIN || 'http://127.0.0.1:4173'
const commands = [
  ['npm', ['run', 'build']],
  ['node', ['scripts/test_official_image_classifier.mjs']],
  ['node', ['scripts/test_official_artwork_rag.mjs']],
  ['node', ['scripts/pressure_chat_pipeline.mjs', '4']],
]

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

async function serverIsReady() {
  try { return (await fetch(origin, { signal: AbortSignal.timeout(1200) })).ok } catch { return false }
}

async function waitForServer(child) {
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    if (await serverIsReady()) return
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  child.kill('SIGTERM')
  throw new Error(`Vite did not become ready at ${origin} within 20 seconds.`)
}

const alreadyRunning = await serverIsReady()
let vite = null
try {
  if (!alreadyRunning) {
    console.log(`Starting a temporary Vite API server at ${origin}…`)
    vite = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'inherit', shell: process.platform === 'win32' })
    await waitForServer(vite)
  } else console.log(`Using the already running AskRosie server at ${origin}.`)

  for (const [command, args] of commands) await run(command, args)
  console.log('\nLIVE PIPELINE CONFIRMED: build, official image classification, official-record RAG, and 4-request pressure test all passed.')
} finally {
  if (vite && !vite.killed) vite.kill('SIGTERM')
}
