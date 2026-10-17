const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function testPipeline() {
  const pdfPath = path.resolve(__dirname, 'Raft_Consensus_Guide.pdf');
  const fileBuffer = fs.readFileSync(pdfPath);

  console.log('1. Uploading PDF to /api/ingest...');
  const formData = new FormData();
  formData.append('document', new Blob([fileBuffer], { type: 'application/pdf' }), 'Raft_Consensus_Guide.pdf');

  const ingestRes = await axios.post('http://localhost:3001/api/ingest', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  console.log('Ingest response:');
  console.log(JSON.stringify(ingestRes.data, null, 2));

  console.log('\n2. Testing /api/documents list...');
  const docsRes = await axios.get('http://localhost:3001/api/documents');
  console.log(`Document count: ${docsRes.data.length}`);

  console.log('\n3. Testing question present in PDF: "Who created the Raft consensus algorithm and when?"...');
  const chatRes1 = await axios.post('http://localhost:3001/api/chat', {
    message: 'Who created the Raft consensus algorithm and when?',
    documentName: 'Raft_Consensus_Guide.pdf'
  });
  console.log('Answer 1:');
  console.log(chatRes1.data.answer);
  console.log('Sources 1:', chatRes1.data.sources);
  console.log('Score 1:', (chatRes1.data.score * 100).toFixed(1) + '%');

  console.log('\n4. Testing question on Election Timeout: "What is the randomized range for election timeouts in Raft?"...');
  const chatRes2 = await axios.post('http://localhost:3001/api/chat', {
    message: 'What is the randomized range for election timeouts in Raft?'
  });
  console.log('Answer 2:');
  console.log(chatRes2.data.answer);
  console.log('Score 2:', (chatRes2.data.score * 100).toFixed(1) + '%');

  console.log('\n5. Testing question ABSENT from the PDF: "What is the recipe for chocolate chip cookies?"...');
  const chatRes3 = await axios.post('http://localhost:3001/api/chat', {
    message: 'What is the recipe for baking chocolate chip cookies in an oven?',
    documentName: 'Raft_Consensus_Guide.pdf'
  });
  console.log('Answer 3 (Absent topic):');
  console.log(chatRes3.data.answer);
  console.log('Chunks used:', chatRes3.data.chunksUsed);

  console.log('\nAll RAG test assertions finished!');
}

testPipeline().catch(err => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});
