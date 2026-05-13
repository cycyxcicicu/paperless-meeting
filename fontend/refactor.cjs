const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const findFiles = (dir, ext) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(file, ext));
        } else if (file.endsWith(ext) || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
};

const tsxFiles = findFiles(srcDir, '.tsx');

let changedFilesCount = 0;

tsxFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace AppPagination -> Pagination
    content = content.replace(/import\s+\{\s*AppPagination\s*\}\s+from\s+['"].*AppPagination['"];/g, 
      "import { Pagination as AppPagination } from '@/app/components/common/ui/Pagination';");
      
    // Replace hp-button -> common/ui/Button
    content = content.replace(/import\s+\{\s*Button\s*(?:,\s*buttonVariants\s*)?\}\s+from\s+['"].*hp-button['"];/g,
      "import { Button } from '@/app/components/common/ui/Button';");

    // Replace hp-badge -> ui/badge
    content = content.replace(/import\s+\{\s*Badge\s*\}\s+from\s+['"].*hp-badge['"];/g,
      "import { Badge } from '@/app/components/ui/badge';");
      
    // Replace hp-card -> ui/card
    content = content.replace(/import\s+\{\s*(Card[^}]*)\}\s+from\s+['"].*hp-card['"];/g,
      "import { $1 } from '@/app/components/ui/card';");

    // Replace hp-tabs -> ui/tabs
    content = content.replace(/import\s+\{\s*(Tabs[^}]*)\}\s+from\s+['"].*hp-tabs['"];/g,
      "import { $1 } from '@/app/components/ui/tabs';");

    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        changedFilesCount++;
        console.log('Updated:', file);
    }
});

console.log(`Updated ${changedFilesCount} files.`);
