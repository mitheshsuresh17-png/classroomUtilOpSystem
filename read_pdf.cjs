const fs = require('fs');
const pdf = require('node_modules/pdf-parse/index.js');
let dataBuffer = fs.readFileSync('documentation/Review 3 rubrics.pdf');
pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(console.error);
