# Image Upload Guide for Pattern & Outline Validation

## Overview

Your uploaded images are automatically validated using AI-powered analysis to ensure optimal results. This guide explains the upload requirements and common issues.

## Feature Highlights

✅ **User Pattern Upload**: Upload your own custom patterns to use for fills
✅ **Marketplace**: Sell your patterns to other users
✅ **AI Validation**: Automatic detection and helpful error messages
✅ **Quality Checks**: Ensures images will work properly before processing

---

## Pattern Images (Designs for Filling)

### Requirements
- **Format**: PNG, JPG, JPEG, or SVG
- **Size**: Maximum 10MB
- **Dimensions**: 
  - Minimum: 100x100 px
  - Maximum: 4000x4000 px
  - **Recommended**: 500-1500px (optimal range)
- **Background**: Pure white (#FFFFFF)
- **Density**: At least 8% dark pixels (detailed design required)

### What Makes a Good Pattern?
✓ High-contrast detailed design
✓ Solid white background
✓ Clear, crisp lines
✓ Repeating or seamless textures work best
✓ No gradients or shadows

### Common Issues
❌ **"Image appears too simple for a pattern"**
   - Your image has too few dark pixels
   - Solution: Use images with detailed scrollwork, textures, or intricate designs

❌ **"Background is not pure white"**
   - Shadows, reflections, or colored backgrounds detected
   - Solution: Use an image editor to ensure background is solid white (#FFFFFF)

❌ **"Pattern is very dense"**
   - Warning: Extremely complex patterns may be hard to scale
   - Consider: Simplifying or using at larger sizes

---

## Outline Images (Shapes to Fill)

### Requirements
- **Format**: PNG, JPG, JPEG, or SVG
- **Size**: Maximum 10MB
- **Dimensions**: 
  - Minimum: 100x100 px
  - Maximum: 4000x4000 px
  - **Recommended**: 500-1500px (optimal range for best results)
- **Background**: Pure white (#FFFFFF)
- **Density**: Less than 18% dark pixels (simple silhouette required)
- **Shape**: Completely closed outline

### What Makes a Good Outline?
✓ Simple, clean silhouette
✓ Completely closed shape (no gaps)
✓ Solid white background
✓ Clear black outline
✓ Not too thin (minimum ~20px width)
✓ Not too complex

### Critical Size Recommendations

⚠️ **IMAGE SIZE MATTERS!**

Based on user testing, outline size significantly affects quality:

| Size | Result | Recommendation |
|------|--------|----------------|
| **~200mm (1000-1500px)** | ✅ **Best Results** | Use this size for optimal quality |
| **150mm (800-1000px)** | ✅ Good | Acceptable, may be slightly less detailed |
| **250mm+ (1600px+)** | ⚠️ Issues Start | Outline distortion/poor filling may occur |
| **300mm+ (2000px+)** | ❌ Problems | Significant quality degradation |

**Recommendation**: Keep your outline images between **150-200mm equivalent** (approximately 800-1500 pixels on the longest side).

### Common Issues

❌ **"Outline appears to have gaps"**
   - Your shape is not completely closed
   - Solution: Check in an image editor and close all paths
   - Tip: Look carefully at corners and where lines meet

❌ **"Outline touches image edges"**
   - Your outline extends to the image border
   - Solution: Add white space padding around your outline
   - Tip: Ensure 20-30px margin on all sides

❌ **"Very complex outline detected"**
   - Example: Full pistol/weapon layouts with multiple components
   - **Solution**: For best results with complex items like firearms:
     1. Break the design into separate components
     2. Upload grip, slide, frame, etc. individually
     3. Fill each component separately
     4. Reassemble in your design software
   - **Why**: The AI produces cleaner, more detailed scrollwork on simpler shapes

❌ **"Detected gradients or shadows"**
   - Source image has subtle shadows or anti-aliasing
   - Solution: Clean up image in photo editor
   - Tip: Use "contrast-stretch" or "levels" to remove gray pixels

❌ **"Detected thin areas"**
   - Some parts of outline are very narrow
   - Warning: Patterns may not fill properly in thin sections
   - Solution: Simplify or widen narrow areas

---

## Auto-Detection Feature

The system can automatically detect whether an image is a pattern or outline:

```
Density < 8%  → Likely an outline (too simple)
Density 8-18% → Could be either (analyzed further)
Density > 18% → Likely a pattern (complex design)
```

Use the **Auto-Detect** validation to let the AI determine the image type.

---

## Marketplace Features

### Uploading for Sale
- Set `is_public: true` to list on marketplace
- Set a `price` (minimum $0, can be free)
- Add descriptive `tags` for searchability
- Provide clear `description` of your pattern
- Categories: `scrollwork`, `leatherwork`, `other`

### Pattern Statistics
- Track download count
- View user ratings
- Monitor revenue
- See popularity metrics

### Permissions
- Edit/delete only your own patterns
- View all public patterns
- Download patterns you've purchased or created

---

## API Endpoints

### Validate Pattern
```http
POST /api/patterns/validate/pattern
Content-Type: multipart/form-data

file: [image file]
```

### Validate Outline
```http
POST /api/patterns/validate/outline
Content-Type: multipart/form-data

file: [image file]
```

### Auto-Detect Type
```http
POST /api/patterns/validate/auto
Content-Type: multipart/form-data

file: [image file]
```

### Upload Pattern
```http
POST /api/patterns/upload
Content-Type: multipart/form-data

file: [image file]
name: "My Custom Pattern"
category: "scrollwork"
description: "Detailed Victorian scrollwork"
tags: "scrollwork,victorian,ornate"
is_public: true
price: 4.99
```

### List Marketplace Patterns
```http
GET /api/marketplace/patterns?category=scrollwork&sort_by=popular
```

---

## Troubleshooting Common Scenarios

### "Generated image did not fill properly"

**Possible Causes:**
1. **Unnoticeable gaps** → Use gap detection validation
2. **Subtle shadows** → Check background purity validation
3. **Too complex** → Break into simpler components
4. **Wrong size** → Use 150-200mm equivalent (800-1500px)
5. **Thin areas** → Check for sections < 20px wide

**Solutions:**
1. Run validation endpoint before processing
2. Check validation warnings carefully
3. Edit image based on specific feedback
4. Re-upload and validate again

### "Full pistol or AR outline won't fill properly"

**Best Practice:**
1. Upload **grip separately** → Fill with pattern
2. Upload **slide separately** → Fill with pattern
3. Upload **frame separately** → Fill with pattern
4. Upload **trigger guard separately** → Fill with pattern
5. Reassemble components in design software

**Why:** The AI excels at filling simple, well-defined shapes. Complex assemblies with many intricate parts work better when broken down.

---

## Image Preparation Tips

### Using Photoshop/GIMP
1. Convert to grayscale
2. Adjust levels: Make blacks pure black, whites pure white
3. Use threshold tool to eliminate gradients
4. Ensure background is #FFFFFF
5. Save as PNG for best quality

### Using Inkscape (for SVG)
1. Trace bitmap if needed
2. Ensure paths are closed
3. Remove any gradients or filters
4. Set background to white
5. Export as PNG at recommended size (1000-1500px)

### Using Online Tools
- Remove.bg (for background removal)
- Cleanup.pictures (for cleaning artifacts)
- Photopea.com (free Photoshop alternative)

---

## Validation Response Example

```json
{
  "success": true,
  "validation": {
    "is_valid": true,
    "errors": [],
    "warnings": [
      "Image is larger than optimal (1800px max dimension). Dimensions between 500-1500px often produce the best results."
    ],
    "metadata": {
      "width": 1800,
      "height": 1200,
      "max_dimension": 1800,
      "optimal_size": false,
      "density": 12.5,
      "complexity": "medium",
      "white_ratio": 0.85,
      "background_quality": "good",
      "edge_black_ratio": 0.02,
      "thin_area_count": 3
    }
  },
  "message": "Image validated successfully, but please note:\n• Image is larger than optimal..."
}
```

---

## Support

If you encounter issues:
1. Check the validation response for specific errors
2. Review this guide for solutions
3. Ensure you meet all requirements
4. Try breaking complex shapes into simpler components
5. Keep images in the 150-200mm / 800-1500px optimal range

For questions about marketplace features or pattern uploads, contact support.
