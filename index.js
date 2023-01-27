require('dotenv').config()
const express = require('express')
const cors = require('cors')
const NodeCache = require("node-cache")
const { BigQuery } = require('@google-cloud/bigquery')

const bigquery = new BigQuery({
  keyFilename: 'key.json',
  projectId: process.env.projectName,
})

const app = express()
const myCache = new NodeCache({ stdTTL: 86400 })
app.use(cors({ origin: '*' }))

app.get('/test', async (req, res) => {

  // pull fresh data
  const query = `
    SELECT blockheight
    FROM \`minaexplorer.archive.blocks\`
    LIMIT 1
  `
  const options = {
    query: query,
    location: 'US',
  }

  try {
    const [rows] = await bigquery.query(options)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).send(err.message)
  }
})

app.get('/all_time_validators', async (req, res) => {

  // use cache
  cache_key = 'all_time_validators'
  const data = myCache.get(cache_key)
  if (data) { return res.json(data) }

  // pull fresh data
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
    location: 'US',
  }

  try {
    let [rows] = await bigquery.query(options)

    // accumulate validators
    rows = rows.map((item, index, array) => {
      return {
        epoch: item.epoch + 1, // make the epoch start at 1 not 0
        validator: array.slice(0, index).reduce(
          (accum, item_) => accum + item_.validator, item.validator)
      }
    })

    myCache.set(cache_key, rows)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).send(err.message)
  }
})

app.get('/active_snark_workers', async (req, res) => {

  // use cache
  cache_key = 'active_snark_workers'
  const data = myCache.get(cache_key)
  if (data) { return res.json(data) }

  // pull fresh data
  // first get the current block
  const url = 'https://api.minaexplorer.com/summary'
  let response = await fetch(url, { method: 'GET' })
  response = await response.json()
  const last_block = response.blockchainLength
  const look_back_blocks = 2500

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
    location: 'US',
  }

  try {
    const [rows] = await bigquery.query(options)

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

    myCache.set(cache_key, snark_counts)
    res.json(snark_counts)
  } catch (err) {
    console.error(err)
    res.status(500).send(err.message)
  }
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
