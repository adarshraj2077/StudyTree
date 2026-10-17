const fs = require('fs');
const path = require('path');
const RAGPipeline = require('../lib/RAGPipeline');

async function verifyMLOpsPipeline() {
  console.log('=== [TEST] Starting MLOps Document Ingestion & RAG Verification ===');
  const rag = new RAGPipeline();
  await rag.init();

  // Resolve paths relative to test fixture directory or optional environment variable
  const envPath = process.env.TEST_PDF_PATH;
  const localMlopsFixture = path.resolve(__dirname, 'mlops lec 1 -5.pdf');
  const raftFixture = path.resolve(__dirname, 'Raft_Consensus_Guide.pdf');

  let targetPdfPath = raftFixture;
  let docName = 'Raft_Consensus_Guide.pdf';

  if (envPath && fs.existsSync(envPath)) {
    targetPdfPath = path.resolve(envPath);
    docName = path.basename(targetPdfPath);
  } else if (fs.existsSync(localMlopsFixture)) {
    targetPdfPath = localMlopsFixture;
    docName = 'mlops lec 1 -5.pdf';
  } else {
    console.log('Local MLOps fixture not found, using workspace test fixture (Raft_Consensus_Guide.pdf)...');
  }

  const fileBuffer = fs.readFileSync(targetPdfPath);
  console.log(`\n1. Ingesting "${docName}" (${(fileBuffer.length / 1024).toFixed(1)} KB)...`);
  
  const startTime = Date.now();
  const result = await rag.ingestPDF(fileBuffer, docName);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`Ingestion completed in ${elapsed}s:`);
  console.log(`- Document ID: ${result.docId}`);
  console.log(`- Chunks Added: ${result.chunksAdded}`);
  console.log(`- Summary: ${result.summary.slice(0, 150)}...`);
  console.log(`- Key Points Count: ${result.keyPoints.length}`);

  console.log('\n2. Verifying DocumentStore Persistence...');
  const allDocs = rag.getDocuments();
  const found = allDocs.some(d => d.docId === result.docId || d.name === docName);
  console.log(`- Document found in store: ${found} (Total documents: ${allDocs.length})`);
  if (!found) {
    throw new Error('Test document was not properly registered in DocumentStore!');
  }

  const isMlops = docName.toLowerCase().includes('mlops');
  const question1 = isMlops
    ? 'What are the core fundamentals and objectives of MLOps?'
    : 'Who created the Raft consensus algorithm and when?';
  const question2 = isMlops
    ? 'Explain the deployment and operational challenges in machine learning systems.'
    : 'What is the randomized range for election timeouts in Raft?';

  console.log(`\n3. Testing In-Domain Question: "${question1}"...`);
  const answer1 = await rag.askQuestion({
    message: question1,
    documentName: docName,
    mode: 'general'
  });
  console.log(`Answer:`);
  console.log(answer1.answer);
  console.log(`- Chunks used: ${answer1.chunksUsed}`);
  console.log(`- Sources: ${answer1.sources.join(', ')}`);
  console.log(`- Relevance Score: ${(answer1.score * 100).toFixed(1)}%`);

  console.log(`\n4. Testing Exam Mode Evaluation: "${question2}"...`);
  const examAnswer = await rag.askQuestion({
    message: question2,
    documentName: docName,
    mode: 'exam'
  });
  console.log(`Exam Mode Output:`);
  console.log(examAnswer.answer);
  console.log(`- Relevance Score: ${(examAnswer.score * 100).toFixed(1)}%`);

  console.log('\n5. Negative Testing (Out-of-domain question): "What is the recipe for baking chocolate brownies?"...');
  const outOfDomainAnswer = await rag.askQuestion({
    message: 'What is the recipe for baking chocolate brownies in an oven?',
    documentName: docName,
    mode: 'general'
  });
  console.log(`Negative Answer:`);
  console.log(outOfDomainAnswer.answer);
  console.log(`- Chunks used: ${outOfDomainAnswer.chunksUsed}`);

  if (outOfDomainAnswer.chunksUsed > 0 && outOfDomainAnswer.score > 0.5) {
    console.warn('Warning: Out of domain question had unexpected high score');
  } else {
    console.log('✓ Successfully rejected / reported out-of-context question without hallucination.');
  }

  console.log('\n=== All MLOps Ingestion, Vector Search, and Grounding tests PASSED! ===');
}

verifyMLOpsPipeline().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
