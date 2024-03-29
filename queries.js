require('dotenv').config()
const { BigQuery } = require('@google-cloud/bigquery')

// to make BigQuery requests GCP credentials are required:
// key.json and projectId. Both stored in root dir.
const bigquery = new BigQuery({
  keyFilename: 'key.json',
  projectId: process.env.projectName,
})


const test = async () => {

  const query = `
    SELECT blockheight
    FROM \`minaexplorer.archive.blocks\`
    ORDER BY blockheight DESC
    LIMIT 1
  `
  const options = {
    query: query,
    format: 'json',
    location: 'US',
  }

  return await bigquery.query(options)
}


const get_all_time_validators = async (req, res) => {

  const query = `
    SELECT epoch, COUNT(creator) as validator
    FROM (
      SELECT distinct creator, MIN(protocolstate.consensusstate.epoch) as epoch
      FROM \`minaexplorer.archive.blocks\`
      GROUP BY creator
    )
    GROUP BY epoch
    ORDER BY epoch ASC
  `
  const options = {
    query: query,
    format: 'json',
    location: 'US',
  }

  let rows = await bigquery.query(options)
  rows = rows[0]

  // accumulate validators
  rows = rows.map((item, index, array) => {
    return {
      epoch: item.epoch,
      validator: array.slice(0, index).reduce(
        (accum, item_) => accum + item_.validator, item.validator)
    }
  })

  // there's an unforch innacuracy in the query which might result in
  // missing some epoch data if there was no unique validators in it.

  // in case we are missing the last epoch data,
  // make sure we know the number of the last epoch
  const url = 'https://api.minaexplorer.com/summary'
  let response = await fetch(url, { method: 'GET' })
  response = await response.json()
  const last_epoch = response.epoch

  // iterate over each epoch and check if epoch is missing
  for (let epoch = 0; epoch <= last_epoch; epoch++) {
    let epoch_idx = epoch
    if (rows[epoch_idx]?.epoch == epoch) { // not missing
      continue
    } else { // is missing
      let missing_epoch = {
        'epoch': epoch,
        'validator': rows[epoch_idx - 1].validator
      }
      // insert epoch at specified idx
      rows = [
        ...rows.slice(0, epoch_idx),
        missing_epoch,
        ...rows.slice(epoch_idx)
      ]
    }
  }

  return rows
}


const get_active_snark_workers = async (req, res) => {

  // first get the current block
  const url = 'https://api.minaexplorer.com/summary'
  let response = await fetch(url, { method: 'GET' })
  response = await response.json()
  const last_block = response.blockchainLength
  const look_back_blocks = 5000

  const query = `
    SELECT distinct prover, MIN(blockheight) as blockheight
    FROM \`minaexplorer.archive.snarks\`
    WHERE canonical = true
    AND blockheight >= ${last_block - look_back_blocks}
    GROUP BY prover
    ORDER BY blockheight ASC
  `
  const options = {
    query: query,
    format: 'json',
    location: 'US',
  }

  let rows = await bigquery.query(options)
  rows = rows[0]

  // refactor the data so that we've got the following:
  // { blockheight: int, snark_workers: int }
  // also fill missing blocks so that the data is proper timeseries

  // first lets create an array starting from oldest block
  // and ending at newest, incrementing by 1
  const unique_blocks = new Set(rows.map(item => item.blockheight))
  const range = (start, stop, step) => {
    return Array.from({
      length: (stop - start) / step + 1
    }, (_, i) => start + (i * step))
  }
  const start = last_block - look_back_blocks
  const stop = last_block
  const step = 1
  blocks = range(start, stop, step)

  // lets add the accumulated number of snarks to each block
  const snark_counts = []
  let accum = 0
  blocks.forEach(block => {
    accum += rows.filter(item => item.blockheight == block).length
    snark_counts.push({
      blockheight: block,
      snark_workers: accum
    })
  })

  return snark_counts
}


const get_stake_distribution = async (req, res) => {

  const query = `

    WITH

      top_stake_accounts AS (
        SELECT epoch, SUM(balance) as balance_of_top_20, COUNT(row_number_) as row_number_
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY epoch ORDER BY balance DESC) AS row_number_
          FROM (
            SELECT epoch, delegate, SUM(balance) as balance
            FROM \`minaexplorer.archive.ledgers\`
            WHERE delegate IN (SELECT distinct creator FROM \`minaexplorer.archive.blocks\`)
            GROUP BY epoch, delegate
          )
        )
        WHERE row_number_ <= 20
        GROUP BY epoch
        ORDER BY epoch DESC, balance_of_top_20 DESC
      ),

      total_epoch_stake AS (
        SELECT epoch, SUM(balance) as total_stake
        FROM \`minaexplorer.archive.ledgers\`
        GROUP BY epoch
        ORDER BY epoch DESC
      )

    SELECT
      a.epoch,
      a.row_number_ as top_account_count,
      a.balance_of_top_20,
      b.total_stake,
      a.balance_of_top_20 / b.total_stake as stake_pct_of_top_accounts
    FROM top_stake_accounts as a
    LEFT JOIN total_epoch_stake as b
    ON a.epoch = b.epoch
    ORDER BY a.epoch ASC

  `
  const options = {
    query: query,
    format: 'json',
    location: 'US',
  }

  let rows = await bigquery.query(options)
  return rows
}


module.exports = {
  test,
  get_all_time_validators,
  get_active_snark_workers,
  get_stake_distribution,
}
