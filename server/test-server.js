const http = require('http');

// Function to test if a server is running on a specific port
function testServerConnection(host, port) {
  return new Promise((resolve, reject) => {
    console.log(`Starting connection to ${host}:${port}...`);
    
    const req = http.request({
      host: host,
      port: port,
      path: '/api/check-firebase',
      method: 'GET',
      timeout: 2000, // 2 second timeout
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response status code: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log('Response data:', response);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          console.log('Response (raw):', data);
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error connecting to ${host}:${port}:`, error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error(`Connection to ${host}:${port} timed out`);
      req.destroy();
      reject(new Error('Connection timed out'));
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('Testing server connections...');
  
  const hosts = [
    'localhost',
    '127.0.0.1',
  ];
  
  for (const host of hosts) {
    try {
      console.log(`\nTesting connection to ${host}:3001...`);
      await testServerConnection(host, 3001);
      console.log(`✅ Server running at ${host}:3001`);
    } catch (error) {
      console.log(`❌ Server not accessible at ${host}:3001: ${error.message}`);
    }
  }
  
  console.log('\nTests completed.');
  process.exit(0);
}

// Run the tests
runTests(); 