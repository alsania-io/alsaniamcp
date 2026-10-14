#!/usr/bin/env node

// Test script to verify alsania-tools import

console.log('Testing alsania-tools import...\n');

try {
  // Try importing the whole package
  const tools = await import('@alsania/alsania-tools');
  console.log('✅ Successfully imported @alsania/alsania-tools');
  console.log('📦 Available categories:', Object.keys(tools).filter(k => !k.startsWith('_')).join(', '));
  
  // Try importing specific category
  const { agent } = await import('@alsania/alsania-tools');
  console.log(`\n✅ Agent category has ${Object.keys(agent).length} tools`);
  console.log('   Sample tools:', Object.keys(agent).slice(0, 5).join(', '));
  
  // Try importing a specific tool
  const { a2a_register_agent } = await import('@alsania/alsania-tools');
  console.log('\n✅ Successfully imported a2a_register_agent');
  console.log('   Type:', typeof a2a_register_agent);
  
  console.log('\n🎉 All imports working! Ready to integrate with AlsaniaMCP.');
  
} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('\nMake sure you ran:');
  console.error('  cd /home/sigma/Desktop/echo-lab/echo-sys/services/alsaniamcp');
  console.error('  npm link /home/sigma/Desktop/insidedev/sigma-lab/registry-mcp/alsania-tools');
  process.exit(1);
}
