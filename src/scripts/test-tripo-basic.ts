/**
 * BASIC TRIPO API TEST
 * 
 * This script tests the absolute basics:
 * 1. Call Tripo API to generate a simple 3D model from text
 * 2. Poll until complete
 * 3. Get the GLB URL back
 * 
 * Run with: bun run scripts/test-tripo-basic.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from src directory
config({ path: resolve(__dirname, '../.env.local') });

const TRIPO_API_KEY = process.env.TRIPO_API_KEY;
const TRIPO_API_BASE = 'https://api.tripo3d.ai/v2/openapi';

// Simple sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testTripoBasic() {
  console.log('🚀 Starting Tripo API Basic Test\n');
  
  // Step 1: Validate API key
  console.log('📋 Step 1: Validate API Key');
  if (!TRIPO_API_KEY) {
    console.error('❌ ERROR: TRIPO_API_KEY not found in .env.local');
    console.error('   Please add your key: TRIPO_API_KEY="tsk_..."');
    process.exit(1);
  }
  console.log('✅ API Key found:', TRIPO_API_KEY.substring(0, 10) + '...\n');

  // Step 2: Submit generation task
  console.log('📋 Step 2: Submit Text-to-3D Task');
  console.log('   Prompt: "a simple cube"');
  
  try {
    const createResponse = await fetch(`${TRIPO_API_BASE}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIPO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'text_to_model',
        prompt: 'a simple cube'
      })
    });

    console.log('   HTTP Status:', createResponse.status);
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ API Error:', errorText);
      process.exit(1);
    }

    const createData = await createResponse.json();
    console.log('   Raw Response:', JSON.stringify(createData, null, 2));
    
    // Extract task ID (handle both wrapped and unwrapped responses)
    const taskId = createData.data?.task_id || createData.task_id;
    
    if (!taskId) {
      console.error('❌ ERROR: No task_id in response');
      process.exit(1);
    }
    
    console.log('✅ Task Created:', taskId, '\n');

    // Step 3: Poll for completion
    console.log('📋 Step 3: Poll for Completion');
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s intervals)
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`   Attempt ${attempts}/${maxAttempts}...`);
      
      const statusResponse = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TRIPO_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('❌ Status Check Error:', errorText);
        process.exit(1);
      }

      const statusData = await statusResponse.json();
      
      // Extract task data (handle wrapped response)
      const task = statusData.data || statusData;
      
      console.log(`   Status: ${task.status}, Progress: ${task.progress || 0}%`);
      
      if (task.status === 'success') {
        console.log('\n✅ SUCCESS! Task Complete\n');
        console.log('📦 Full Task Data:', JSON.stringify(task, null, 2));
        
        // Extract the GLB model URL (NOT the preview images!)
        const modelUrl = 
          task.output?.pbr_model ||           // Direct URL string (this is the GLB!)
          task.result?.pbr_model?.url ||      // Alternative location
          null;
        
        // Also get preview image for reference
        const previewUrl = task.output?.rendered_image || task.thumbnail || null;
        
        if (modelUrl) {
          console.log('\n╔═══════════════════════════════════════════════════════════════');
          console.log('║ ✅ SUCCESS - 3D MODEL GLB URL (Copy this for the viewer!):');
          console.log('╠═══════════════════════════════════════════════════════════════');
          console.log('║');
          console.log(`║ ${modelUrl}`);
          console.log('║');
          console.log('╚═══════════════════════════════════════════════════════════════\n');
          
          if (previewUrl) {
            console.log('📸 Preview Image URL (WebP - NOT for 3D viewer):');
            console.log(`   ${previewUrl.substring(0, 80)}...\n`);
          }
          
          console.log('✅ Test Complete - Generation Successful!');
          console.log('   👆 Copy the GLB URL above (ends with .glb)');
          console.log('   ⚠️  Do NOT copy the preview image URL (ends with .webp)');
          console.log('   🔗 Paste into: http://localhost:3000/test-3d');
        } else {
          console.log('\n⚠️  WARNING: Task succeeded but no model URL found');
          console.log('   Check the Full Task Data above to see the actual structure');
        }
        
        return;
      }
      
      if (task.status === 'failed') {
        console.error('\n❌ Task Failed:', task.error || 'No error message');
        process.exit(1);
      }
      
      // Wait before next poll
      await sleep(5000); // 5 seconds
    }
    
    console.error('\n❌ Timeout: Task did not complete in 5 minutes');
    process.exit(1);
    
  } catch (error) {
    console.error('\n❌ Unexpected Error:', error);
    process.exit(1);
  }
}

// Run the test
testTripoBasic();
