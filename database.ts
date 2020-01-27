import {promises} from 'fs'
import {join} from 'path'
const {readdir, readFile} = promises

import {Client, ClientConfig} from 'pg'

/**
Try to create a database named `config.database` by connecting to the standard
'postgres' database, treating the 'already exists' error as success.
*/
export async function createDatabase(config: ClientConfig): Promise<void> {
  const client = new Client({...config, database: 'postgres'})
  await client.connect()
  await client.query(`CREATE DATABASE ${config.database}`).catch(err => {
    if (!err.message.match(/^database .* already exists$/)) {
      throw err
    }
  })
  await client.end()
}

export async function executePatches(config: ClientConfig, patches_dirpath: string): Promise<void> {
  const patches_table = '_schema_patches'
  const client = new Client(config)
  await client.connect()

  const filenames = await readdir(patches_dirpath)

  await client.query(
    `CREATE TABLE IF NOT EXISTS ${patches_table} (
       filename TEXT NOT NULL,
       applied TIMESTAMP DEFAULT current_timestamp NOT NULL
     )`,
  )
  const patches = await client.query(`SELECT * FROM ${patches_table}`)

  const applied_filenames: string[] = patches.rows.map(patch => patch.filename)
  const unapplied_filenames = filenames
    .filter(filename => {
      return applied_filenames.indexOf(filename) === -1 && filename.match(/\.sql$/)
    })
    .sort()

  for (const unapplied_filename of unapplied_filenames) {
    const unapplied_filepath = join(patches_dirpath, unapplied_filename)
    const file_contents = await readFile(unapplied_filepath, {encoding: 'utf8'})

    await client.query(file_contents)
    await client.query(`INSERT INTO ${patches_table} (filename) VALUES ($1)`, [unapplied_filename])
  }
  await client.end()
}

export function initializeDatabase(
  config: ClientConfig,
  patches_dirpath: string,
  callback: (error?: Error) => void,
): void {
  createDatabase(config)
    .then(async _ => executePatches(config, patches_dirpath))
    .then(_ => callback(), callback)
}
