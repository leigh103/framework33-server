const toGBP = (price)=>{
    var f = new Intl.NumberFormat('en-GB', {
        style: 'decimal',
        currency: 'GBP',
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2
    })
    return f.format(price)
}

module.exports = toGBP
