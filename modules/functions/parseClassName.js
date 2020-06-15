const parseClassName = (name)=>{

    name = name.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })
    return name.charAt(0).toUpperCase() + name.slice(1)

}

module.exports = parseClassName
