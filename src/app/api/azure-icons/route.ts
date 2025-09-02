import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * API Route to serve Azure icons for diagram generation
 * Provides access to the local Azure icon collection
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const iconName = searchParams.get('icon');
    const category = searchParams.get('category') || 'general';

    if (!iconName) {
      // Return list of available icons
      const iconsDir = path.join(process.cwd(), 'public', 'Azure_Public_Service_Icons', 'Icons');
      
      try {
        const categories = await fs.readdir(iconsDir);
        const iconList: Record<string, string[]> = {};
        
        for (const cat of categories) {
          if (cat !== '.DS_Store') {
            const categoryPath = path.join(iconsDir, cat);
            const categoryStats = await fs.stat(categoryPath);
            
            if (categoryStats.isDirectory()) {
              const files = await fs.readdir(categoryPath);
              iconList[cat] = files.filter(file => file.endsWith('.svg'));
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          categories: iconList,
          message: 'Available Azure icons by category'
        });
      } catch (error) {
        console.error('❌ [Azure Icons API] Error reading icons directory:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to read icons directory'
        }, { status: 500 });
      }
    }

    // Serve specific icon
    let iconPath: string;
    
    if (category === 'custom') {
      // Use custom icons from azure-icons directory
      iconPath = path.join(process.cwd(), 'public', 'azure-icons', `${iconName}.svg`);
    } else {
      // Use icons from Azure_Public_Service_Icons directory
      // Handle category names with spaces and special characters
      const categoryPath = category.replace(/\+/g, ' ').replace(/\s+/g, ' ');
      iconPath = path.join(process.cwd(), 'public', 'Azure_Public_Service_Icons', 'Icons', categoryPath, iconName);
      
      // Ensure .svg extension is added if not present
      if (!iconPath.endsWith('.svg')) {
        iconPath += '.svg';
      }
    }

    try {
      const iconContent = await fs.readFile(iconPath, 'utf-8');
      
      return new NextResponse(iconContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });
    } catch (error) {
      console.error(`❌ [Azure Icons API] Icon not found: ${iconPath}`, error);
      return NextResponse.json({
        success: false,
        error: `Icon ${iconName} not found in category ${category}`
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('❌ [Azure Icons API] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
