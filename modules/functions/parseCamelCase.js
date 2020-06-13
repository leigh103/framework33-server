const parseCamelCase = (name)=>{

    return name.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })

}

module.exports = parseCamelCase
