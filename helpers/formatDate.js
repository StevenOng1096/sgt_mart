function formatDate(value) {
    let date = value.toLocaleDateString('id-ID', { 
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).split("/").reverse().join("-")
    return date
}

module.exports = formatDate;