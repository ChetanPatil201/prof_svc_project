import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Converts SVG to PlantUML sprite format
 * PlantUML sprites are base64 encoded with specific format
 */
function svgToPlantUMLSprite(svgContent: string): string {
  // Remove XML declaration and comments
  const cleanSvg = svgContent
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  
  // Convert to base64
  const base64 = Buffer.from(cleanSvg, 'utf8').toString('base64');
  
  // PlantUML sprite format: !define <name> <base64>
  return base64;
}

/**
 * API Route to convert Azure icons to PlantUML sprites
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const icon = searchParams.get('icon');
    const category = searchParams.get('category');

    if (!icon || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing icon or category parameter' },
        { status: 400 }
      );
    }

    // Construct the path to the SVG file
    const iconPath = path.join(process.cwd(), 'public', 'Azure_Public_Service_Icons', 'Icons', category, `${icon}.svg`);
    
    try {
      const svgContent = await fs.readFile(iconPath, 'utf8');
      const sprite = svgToPlantUMLSprite(svgContent);
      
      return NextResponse.json({
        success: true,
        sprite,
        icon,
        category
      });
    } catch (fileError) {
      console.error(`❌ [Azure Icons to Sprites] File not found: ${iconPath}`);
      return NextResponse.json(
        { success: false, error: `Icon ${icon} not found in category ${category}` },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ [Azure Icons to Sprites] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
