const express = require('express')
const cors = require('cors')
const NodeCache = require("node-cache")
const {
  test,
  get_all_time_validators,
  get_active_snark_workers,
  get_stake_distribution,
} = require('./queries')


const app = express()
const cache = new NodeCache({ stdTTL: 86400 }) // daily default cache
app.use(cors({ origin: '*' }))

app.get('/test', async (req, res) => {
  try {
    const [rows] = await test()
    res.json(rows)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

app.get('/all_time_validators', async (req, res) => {

  // cache
  const cache_key = 'all_time_validators'
  const data = cache.get(cache_key)
  if (data) { return res.json(data) }

  try {
    const rows = await get_all_time_validators()
    cache.set(cache_key, rows, 3600)
    res.json(rows)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

app.get('/active_snark_workers', async (req, res) => {

  // cache
  const cache_key = 'active_snark_workers'
  const data = cache.get(cache_key)
  if (data) { return res.json(data) }

  try {
    const rows = await get_active_snark_workers()
    cache.set(cache_key, rows, 3600)
    res.json(rows)
  } catch (err) {
    res.status(500).send(err.message)
  }
})


app.get('/stake_distribution', async (req, res) => {

  // cache
  const cache_key = 'stake_distribution'
  const data = cache.get(cache_key)
  if (data) { return res.json(data) }

  try {
    const rows = await get_stake_distribution()
    cache.set(cache_key, rows, 3600)
    res.json(rows)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
