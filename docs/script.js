const Base64 = {
  _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  encode: function (e) {
    let t = ''
    let n, r, i, s, o, u, a
    let f = 0
    e = Base64._utf8_encode(e)
    while (f < e.length) {
      n = e.charCodeAt(f++)
      r = e.charCodeAt(f++)
      i = e.charCodeAt(f++)
      s = n >> 2
      o = (n & 3) << 4 | r >> 4
      u = (r & 15) << 2 | i >> 6
      a = i & 63
      if (isNaN(r)) {
        u = a = 64
      } else if (isNaN(i)) {
        a = 64
      }
      t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
    }
    return t
  },
  decode: function (e) {
    let t = ''
    let n, r, i
    let s, o, u, a
    let f = 0
    e = e.replace(/[^A-Za-z0-9+/=]/g, '')
    while (f < e.length) {
      s = this._keyStr.indexOf(e.charAt(f++))
      o = this._keyStr.indexOf(e.charAt(f++))
      u = this._keyStr.indexOf(e.charAt(f++))
      a = this._keyStr.indexOf(e.charAt(f++))
      n = s << 2 | o >> 4
      r = (o & 15) << 4 | u >> 2
      i = (u & 3) << 6 | a
      t = t + String.fromCharCode(n)
      if (u !== 64) {
        t = t + String.fromCharCode(r)
      }
      if (a !== 64) {
        t = t + String.fromCharCode(i)
      }
    }
    t = Base64._utf8_decode(t)
    return t
  },
  _utf8_encode: function (e) {
    e = e.replace(/\r\n/g, '\n')
    let t = ''
    for (let n = 0; n < e.length; n++) {
      const r = e.charCodeAt(n)
      if (r < 128) {
        t += String.fromCharCode(r)
      } else if (r > 127 && r < 2048) {
        t += String.fromCharCode(r >> 6 | 192)
        t += String.fromCharCode(r & 63 | 128)
      } else {
        t += String.fromCharCode(r >> 12 | 224)
        t += String.fromCharCode(r >> 6 & 63 | 128)
        t += String.fromCharCode(r & 63 | 128)
      }
    }
    return t
  },
  _utf8_decode: function (e) {
    let t = ''
    let n = 0
    let r = 0
    let c2 = 0
    while (n < e.length) {
      r = e.charCodeAt(n)
      if (r < 128) {
        t += String.fromCharCode(r)
        n++
      } else if (r > 191 && r < 224) {
        c2 = e.charCodeAt(n + 1)
        t += String.fromCharCode((r & 31) << 6 | c2 & 63)
        n += 2
      } else {
        c2 = e.charCodeAt(n + 1)
        const c3 = e.charCodeAt(n + 2)
        t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63)
        n += 3
      }
    }
    return t
  }
}

const Inputs = {
  transactions: document.getElementById('transaction-input'),
  portfolio: document.getElementById('portfolio-input'),
  performance: document.getElementById('performance-input'),
  calcButton: document.getElementById('calc-button')
}
const Tables = {
  transactions: document.getElementById('transaction-table'),
  portfolio: document.getElementById('portfolio-table'),
  performance: document.getElementById('performance-table'),
  gains: document.getElementById('gains-table')
}
const ColorKey = {
  best: '#BFE0CE',
  worst: '#E0BEBE'
}

function htmlEscape (text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
function addNumericalCommas (number) {
  return String(number).replace(/(\d)(?=(\d{3})+($|\.))/g, '$1,')
}
function moneyString (number) {
  const str = addNumericalCommas(number)
  const decimalLength = str.match(/(\.\d{0,2}|)$/)[1].length
  return str.replace(/^(-)?/, '$1$') + '.00'.substring(decimalLength, 3)
}

function readFile (input = {}) {
  if (input?.tagName !== 'INPUT') return
  const file = input.files[0]
  if (!file) return Promise.reject(new TypeError('Improper File Type'))
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = event => resolve(event.target.result)
    reader.onerror = error => reject(error)
    reader.readAsText(file)
  })
}
function csvToArray (text) {
  const rows = text.replace(/\n$/, '').split('\n').map(row => {
    return row.replace(/"(|.*?[^\\](?:\\\\)*)"/g, (m0, m1) => '"' + Base64.encode(m1)).split(',')
      .map(col => col.match(/^"/) ? Base64.decode(col.replace(/^"/, '')) : col)
  })
  return rows.filter(row => row.length)
}

Inputs.calcButton.addEventListener('click', async e => {
  const transactions = csvToArray(await readFile(Inputs.transactions))
    .filter((row, index, array) => {
      const cancelCol = array[0].indexOf('Cancel Reason')
      return index === 0 || row[cancelCol] === ''
    })
  const portfolio = csvToArray(await readFile(Inputs.portfolio))
  const performance = csvToArray(await readFile(Inputs.performance))
  console.group('Test')
  console.log(transactions, portfolio, performance);
  [transactions, portfolio, performance].forEach(t => console.table(t))
  console.groupEnd('Test')

  // Show Ranks Table
  const rankCol = performance[0].indexOf('Rank')
  const rankNumbers = performance.map(row => Number(row[rankCol])).filter(rank => rank)
  const perfBest = rankNumbers.reduce((prev, current) => Math.min(prev, current), Infinity)
  const perfWorst = rankNumbers.reduce((prev, current) => Math.max(prev, current), 0)
  performance.forEach((row, index) => {
    const rank = Number(row[rankCol])
    const tr = document.createElement('tr')
    const tag = index ? 'td' : 'th'
    tr.innerHTML = row.map(item => `<${tag}>${htmlEscape(item)}</${tag}>`).join('')
    if (rank === perfBest) tr.style.setProperty('--background-color', ColorKey.best)
    else if (rank === perfWorst) tr.style.setProperty('--background-color', ColorKey.worst)
    Tables.performance.querySelector(index ? 'tbody' : 'thead').appendChild(tr)
  })

  // Show Holdings Table
  portfolio.forEach((row, index) => {
    const tr = document.createElement('tr')
    const tag = index ? 'td' : 'th'
    tr.innerHTML = row.map(item => `<${tag}>${htmlEscape(item)}</${tag}>`).join('')
    Tables.portfolio.querySelector(index ? 'tbody' : 'thead').appendChild(tr)
  })

  // Show Transactions
  transactions.map(row => {
    row.splice(4, 1)
    return row
  }).forEach((row, index, array) => {
    const symbolCol = array[0].indexOf('Symbol')
    if (!row[symbolCol]) row[symbolCol] = 'UNKNOWN'
    const tr = document.createElement('tr')
    const tag = index ? 'td' : 'th'
    tr.innerHTML = row.map(item => `<${tag}>${htmlEscape(item)}</${tag}>`).join('')
    Tables.transactions.querySelector(index ? 'tbody' : 'thead').appendChild(tr)
  })
  document.getElementById('transaction-count').innerText = transactions.length - 1

  // Show Profits Table
  const holdingsList = portfolio.map((stock, i, array) => {
    if (!i) return ''
    return Object.fromEntries(stock.map((col, index) => [array[0][index], col]))
  }).filter(x => x)
  const transactionsList = transactions.map((action, i, array) => {
    if (!i) return ''
    return Object.fromEntries(action.map((col, index) => [array[0][index], col]))
  }).filter(x => x)
  const combinedList = holdingsList.concat(transactionsList).map(item => {
    const { Symbol: symbol, Price: price, Type: type, Amount: amount, Shares: shares } = item
    return { symbol, price, type, amount, shares }
  }).reduce((list, current) => {
    let item = list.find(x => x.symbol === current.symbol)
    if (!item) {
      item = { symbol: current.symbol, totalBuys: 0, totalSales: 0 }
      list.push(item)
    }
    const price = Number(current.price.replace(/[^0-9.-]/g, ''))
    const amount = Number(current.amount?.replace(/[^0-9.-]/g, ''))
    const shares = Number(current.shares?.replace(/[^0-9.-]/g, ''))
    const isBuy = amount && current.type.toLowerCase() === 'buy'
    console.log(amount)
    if (isBuy) item.totalBuys += price * amount
    else item.totalSales += price * (amount || shares)

    return list
  }, []).map(item => {
    item.profit = item.totalSales - item.totalBuys
    item.percentGain = item.profit / item.totalBuys * 100
    return item
  })
  console.log(combinedList)
  console.table(combinedList)

  // combinedList.forEach(row => {
  //   const symbol = row.symbol
  //   const profit = Math.round(Number(row[7].replace(/[^0-9.-]/g,'')) * 1000) / 1000
  //   if (!dict[symbol]) dict[symbol] = 0, totalBuys[symbol] = 0, totalSales[symbol] = 0
  //   dict[symbol] += profit
  //   if (profit < 0) /*BUY*/ totalBuys[symbol] -= profit;
  //   else totalSales[symbol] += profit
  // })

  combinedList.sort((a, b) => {
    return a.percentGain - b.percentGain
  }).forEach((item, index) => {
    const symbol = item.symbol
    const profit = item.profit
    const data = [item.totalBuys, item.totalSales, profit, item.percentGain].map(input => {
      return typeof input === 'number' ? Math.round(input * 1000) / 1000 : input
    })
    const tr = document.createElement('tr')
    if (index === combinedList.length - 1) tr.style.setProperty('--background-color', ColorKey.best)
    else if (index === 0) tr.style.setProperty('--background-color', ColorKey.worst)
    tr.innerHTML = `<td>${symbol}</td><td>${
      moneyString(data[0])
    }</td><td>${
      moneyString(data[1])
    }</td><td>${
      moneyString(data[2])
    }</td><td>${
      addNumericalCommas(data[3])
    }%</td>`
    Tables.gains.querySelector('tbody').appendChild(tr)
  })

  // portfolio.forEach((row, index) => {
  //   const tr = document.createElement('tr')
  //   const tag = index ? 'td' : 'th'
  //   tr.innerHTML = row.map(item => `<${tag}>${htmlEscape(item)}</${tag}>`).join('')
  //   Tables.portfolio.querySelector(index ? 'tbody' : 'thead').appendChild(tr)
  // })
})

// Number('-$12,122.23'.replace(/[^0-9.-]/g,''))
