// Fix for AlsaniaMCP MCP protocol support
// This script patches the HTTP gateway to support standard MCP protocol

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/transport/http-gateway.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Find the problematic section
const lines = content.split('\n');
let inMcpHandler = false;
let modified = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('this.app.post("/mcp"')) {
    inMcpHandler = true;
  }
  
  if (inMcpHandler && lines[i].includes('// Check if this is an MCP protocol request')) {
    // Find the content-type check line
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('application/json-rpc')) {
        // Replace with more permissive check
        lines[j] = lines[j].replace(
          'req.headers[\"content-type\"]?.includes(\"application/json-rpc\")',
          'req.headers[\"content-type\"]?.includes(\"application/json\") || req.body.jsonrpc === \"2.0\"'
        );
        modified = true;
        console.log('Fixed content-type check at line', j + 1);
        break;
      }
    }
    break;
  }
}

if (modified) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('✅ Fixed MCP protocol support in HTTP gateway');
  console.log('AlsaniaMCP will now accept standard MCP requests with application/json content-type');
} else {
  console.log('❌ Could not find content-type check to fix');
}
