const fs = require('fs');

const filePath = 'src/pages/Simulado.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Match the specific pattern with flexible whitespace
const regex = /("\{q\.explanation\}"\}\s*<\/p>\s*<\/div>\s*<\/div>\s*\);\s*\}\);\s*<\/div>\s*<button\s*onClick=\{\(\) => setIsTakingQuiz\(false\)\})/g;

if (regex.test(code)) {
    console.log("MATCH FOUND!");
    code = code.replace(regex, (match) => {
        // We insert an extra </div> to balance the tags!
        return '"{q.explanation}"}\n\t\t\t\t\t\t\t\t\t\t\t\t\t</p>\n\t\t\t\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t\t);\n\t\t\t\t\t\t\t\t});\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<button onClick={() => setIsTakingQuiz(false)}';
    });
    fs.writeFileSync(filePath, code);
    console.log("REPLACEMENT SUCCESSFUL!");
} else {
    console.log("REGEX MATCH FAILED");
    // Let's do a simpler text-based chunk replacement
    console.log("Trying custom string match...");
    const target = '"{q.explanation}"}\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t</p>\r\n\t\t\t\t\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t\t\t);\r\n\t\t\t\t\t\t\t\t\t});';
}
