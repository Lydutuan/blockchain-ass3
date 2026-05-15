const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload() {
  try {
    console.log('Creating test PDF...');
    
    // Create a simple test PDF (just bytes, not a real PDF)
    const testData = Buffer.from('test file content');
    
    const form = new FormData();
    form.append('file', testData, { filename: 'test.pdf', contentType: 'application/pdf' });
    form.append('title', 'Test Medical Record');
    form.append('hospital', 'Test Hospital');
    form.append('description', 'Test Description');
    form.append('recordType', 'lab');
    form.append('uploaderAddress', '0x123456');
    
    console.log('Uploading to http://localhost:5000/api/upload...');
    
    const response = await axios.post('http://localhost:5000/api/upload', form, {
      headers: form.getHeaders(),
    });
    
    console.log('✓ Upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (err) {
    console.error('✗ Upload failed:');
    console.error('Status:', err.response?.status);
    console.error('Error:', err.response?.data || err.message);
  }
}

testUpload();
