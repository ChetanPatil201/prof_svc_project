import { generateCafSubscriptionXml } from './generateCafSubscriptionXml';

console.log('🔍 [DebugCafXml] Starting CAF subscription XML debug...');

try {
  const xml = generateCafSubscriptionXml();
  
  // Check for key structural elements
  console.log('\n📋 [DebugCafXml] XML Structure Analysis:');
  console.log('✅ XML Length:', xml.length);
  console.log('✅ Contains mxfile tag:', xml.includes('<mxfile'));
  console.log('✅ Contains mxGraphModel:', xml.includes('<mxGraphModel'));
  console.log('✅ Contains subscription containers:', xml.includes('sub-mgmt') && xml.includes('sub-connectivity'));
  console.log('✅ Contains VNet containers:', xml.includes('hub-vnet') && xml.includes('spoke-prod-vnet'));
  console.log('✅ Contains subnet containers:', xml.includes('subnet-hub-gateway') && xml.includes('subnet-prod-web'));
  
  // Check for Azure icons
  console.log('\n🎨 [DebugCafXml] Azure Icon Analysis:');
  const iconMatches = xml.match(/\/azure-icons\/[^"]+\.svg/g);
  if (iconMatches) {
    console.log('✅ Found Azure icons:', iconMatches.length);
    console.log('📋 Icon paths found:');
    [...new Set(iconMatches)].forEach(icon => console.log(`   - ${icon}`));
  } else {
    console.log('❌ No Azure icons found in XML');
  }
  
  // Check for container hierarchy
  console.log('\n🏗️ [DebugCafXml] Container Hierarchy Analysis:');
  console.log('✅ Subscription containers with parent="1":', (xml.match(/id="sub-[^"]+"[^>]*parent="1"/g) || []).length);
  console.log('✅ VNet containers with parent="sub-connectivity":', (xml.match(/id="hub-vnet"[^>]*parent="sub-connectivity"/g) || []).length);
  console.log('✅ Subnet containers with parent="hub-vnet":', (xml.match(/id="subnet-hub-[^"]+"[^>]*parent="hub-vnet"/g) || []).length);
  
  // Check for image shapes
  console.log('\n🖼️ [DebugCafXml] Image Shape Analysis:');
  console.log('✅ Contains shape=image:', xml.includes('shape=image'));
  console.log('✅ Contains imageAspect=0:', xml.includes('imageAspect=0'));
  console.log('✅ Contains verticalLabelPosition=bottom:', xml.includes('verticalLabelPosition=bottom'));
  
  // Extract a sample of the XML for inspection
  console.log('\n📄 [DebugCafXml] XML Sample (first 1000 chars):');
  console.log(xml.substring(0, 1000));
  
  // Check for any potential issues
  console.log('\n⚠️ [DebugCafXml] Potential Issues:');
  if (!xml.includes('shape=image')) {
    console.log('❌ No image shapes found - icons may not render');
  }
  if (!xml.includes('/azure-icons/')) {
    console.log('❌ No Azure icon paths found');
  }
  if (!xml.includes('parent=')) {
    console.log('❌ No parent relationships found');
  }
  
  console.log('\n✅ [DebugCafXml] Debug analysis complete');
  
} catch (error) {
  console.error('❌ [DebugCafXml] Error during debug:', error);
}
