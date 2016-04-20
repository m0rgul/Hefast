module.exports = {
    encodeString: function (input) {
        return encodeURIComponent(input).replace(/'/g, "%27").replace(/"/g, "%22").replace(/\(/g, "%28").replace(/\)/g, "%29");
    },

    decodeString: function (input) {
        return decodeURIComponent(input.replace(/\+/g, " ").replace(/\%28/g, "(").replace(/\%29/g, ")"));
    }
};