const html = 'some "shortDescription":"Hello \\"world\\"\\nNew line","other":1';
const match = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
if (match) {
    const fullDesc = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    console.log(fullDesc);
} else {
    console.log("No match");
}
