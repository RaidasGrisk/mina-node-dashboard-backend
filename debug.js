const data = [
    {
        "epoch": 0,
        "validator": 285
    },
    {
        "epoch": 1,
        "validator": 60
    },
    {
        "epoch": 2,
        "validator": 29
    },
    {
        "epoch": 3,
        "validator": 22
    },
    {
        "epoch": 4,
        "validator": 14
    },
    {
        "epoch": 5,
        "validator": 10
    },
    {
        "epoch": 6,
        "validator": 1
    },
    {
        "epoch": 7,
        "validator": 7
    },
    {
        "epoch": 8,
        "validator": 4
    },
    {
        "epoch": 9,
        "validator": 1
    },
    {
        "epoch": 10,
        "validator": 6
    },
    {
        "epoch": 11,
        "validator": 3
    },
    {
        "epoch": 12,
        "validator": 6
    },
    {
        "epoch": 13,
        "validator": 2
    },
    {
        "epoch": 14,
        "validator": 1
    },
    {
        "epoch": 15,
        "validator": 19
    },
    {
        "epoch": 16,
        "validator": 3
    },
    {
        "epoch": 17,
        "validator": 3
    },
    {
        "epoch": 18,
        "validator": 9
    },
    {
        "epoch": 19,
        "validator": 28
    },
    {
        "epoch": 20,
        "validator": 1
    },
    {
        "epoch": 22,
        "validator": 2
    },
    {
        "epoch": 23,
        "validator": 1
    },
    {
        "epoch": 24,
        "validator": 1
    },
    {
        "epoch": 25,
        "validator": 40
    },
    {
        "epoch": 26,
        "validator": 2
    },
    {
        "epoch": 28,
        "validator": 3
    },
    {
        "epoch": 29,
        "validator": 2
    },
    {
        "epoch": 30,
        "validator": 3
    },
    {
        "epoch": 31,
        "validator": 19
    },
    {
        "epoch": 32,
        "validator": 6
    },
    {
        "epoch": 33,
        "validator": 1
    },
    {
        "epoch": 34,
        "validator": 2
    },
    {
        "epoch": 36,
        "validator": 2
    },
    {
        "epoch": 37,
        "validator": 73
    },
    {
        "epoch": 38,
        "validator": 3
    },
    {
        "epoch": 39,
        "validator": 1
    },
    {
        "epoch": 40,
        "validator": 1
    },
    {
        "epoch": 43,
        "validator": 1
    },
    {
        "epoch": 44,
        "validator": 44
    }
]

const result = data.map((item, index, array) => {
  return {
    epoch: item.epoch + 1,
    validator: array.slice(0, index).reduce(
      (accum, item_) => accum + item_.validator, item.validator)
  }
})

console.log(result)
