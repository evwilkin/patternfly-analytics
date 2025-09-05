const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Initialize productUsage structure
const productUsage = {
  imports: {},
  classes: {},
  cssVars: {}
};

// Function to process a single JSON file and extract product usage data
function processJsonFile(filePath, repoName) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Process imports
    if (data.imports) {
      Object.entries(data.imports).forEach(([importPath, importedItems]) => {
        Object.entries(importedItems).forEach(([importName, count]) => {
          if (!productUsage.imports[importName]) {
            productUsage.imports[importName] = {
              product_count: 0,
              total_usage: 0
            };
          }
          
          if (!productUsage.imports[importName][repoName]) {
            productUsage.imports[importName][repoName] = {
              unique_import_paths: 0,
              repo_usage: 0
            };
            productUsage.imports[importName].product_count++;
          }
          
          if (!productUsage.imports[importName][repoName][importPath]) {
            productUsage.imports[importName][repoName][importPath] = {};
            productUsage.imports[importName][repoName].unique_import_paths++;
          }
          
          // For simplicity, we'll just track the count per import path
          productUsage.imports[importName][repoName][importPath] = count;
          productUsage.imports[importName][repoName].repo_usage += count;
          productUsage.imports[importName].total_usage += count;
        });
      });
    }
    
    // Process classes
    if (data.classes) {
      Object.entries(data.classes).forEach(([className, count]) => {
        if (!productUsage.classes[className]) {
          productUsage.classes[className] = {
            product_count: 0,
            total_usage: 0
          };
        }
        
        if (!productUsage.classes[className][repoName]) {
          productUsage.classes[className][repoName] = {
            repo_usage: 0
          };
          productUsage.classes[className].product_count++;
        }
        
        productUsage.classes[className][repoName].repo_usage += count;
        productUsage.classes[className].total_usage += count;
      });
    }
    
    // Process CSS variables
    if (data.cssVars) {
      Object.entries(data.cssVars).forEach(([cssVarName, count]) => {
        if (!productUsage.cssVars[cssVarName]) {
          productUsage.cssVars[cssVarName] = {
            product_count: 0,
            total_usage: 0
          };
        }
        
        if (!productUsage.cssVars[cssVarName][repoName]) {
          productUsage.cssVars[cssVarName][repoName] = {
            repo_usage: 0
          };
          productUsage.cssVars[cssVarName].product_count++;
        }
        
        productUsage.cssVars[cssVarName][repoName].repo_usage += count;
        productUsage.cssVars[cssVarName].total_usage += count;
      });
    }
    
    console.log(`Processed ${repoName}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to sort usage sections by product_count
function sortUsageSection(usageObj) {
  return Object
    .entries(usageObj)
    .sort(([_pfItemName1, pfItemData1], [_pfItemName2, pfItemData2]) => 
      pfItemData2.product_count - pfItemData1.product_count)
    .reduce((acc, [curPfItemName, curPfItemData]) => {
      acc[curPfItemName] = curPfItemData;
      return acc;
    }, {});
}

// Function to get sorted usage
function getSortedUsage(productUsageObj) {
  const sortedResult = {};
  Object.entries(productUsageObj).forEach(([sectionName, sectionData]) => {
    const sortedSection = sortUsageSection(sectionData);
    sortedResult[sectionName] = sortedSection;
  });
  return sortedResult;
}

// Main function
function generateProductUses(targetDir) {
  console.log(`Processing JSON files in ${targetDir}...`);
  
  // Find all JSON files in the target directory (excluding the ones we're generating)
  const jsonFiles = glob.sync(`${targetDir}/*.json`).filter(file => 
    !file.includes('_all') && 
    !file.includes('_suggested') &&
    !file.includes('_deprecated')
  );
  
  console.log(`Found ${jsonFiles.length} JSON files to process`);
  
  // Process each JSON file
  jsonFiles.forEach(filePath => {
    const fileName = path.basename(filePath, '.json');
    processJsonFile(filePath, fileName);
  });
  
  // Generate sorted usage
  const sortedUsage = getSortedUsage(productUsage);
  
  // Write the result
  const outputPath = path.join(targetDir, '_all_product_uses.json');
  fs.writeFileSync(outputPath, JSON.stringify(sortedUsage, null, 2));
  
  console.log(`Generated ${outputPath}`);
  console.log(`Total imports: ${Object.keys(productUsage.imports).length}`);
  console.log(`Total classes: ${Object.keys(productUsage.classes).length}`);
  console.log(`Total CSS vars: ${Object.keys(productUsage.cssVars).length}`);
}

// Get target directory from command line argument or use default
const targetDir = process.argv[2] || path.resolve(__dirname, 'stats-static/2025-08-15');

if (!fs.existsSync(targetDir)) {
  console.error(`Directory ${targetDir} does not exist`);
  process.exit(1);
}

generateProductUses(targetDir);
