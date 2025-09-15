import Bun from 'bun';
import packageJson from './package.json';

// Function to replace version placeholders in TypeScript declaration files
async function replaceVersionInDeclarations() {
    const tsFilesToUpdate = [
        `dist/${packageJson.name}.d.ts`,
        `dist/index.d.ts`,
        `dist/instanceMarker.d.ts`
    ];

    for (const file of tsFilesToUpdate) {
        try {
            const content = await Bun.file(file).text();
            let updatedContent = content.replace(/VERSION_REPLACE_ME/g, packageJson.version);
            updatedContent = updatedContent.replace(/@VERSION_REPLACE_ME/g, `@${packageJson.version}`);
            await Bun.write(file, updatedContent);
            console.log(`Updated version in ${file}`);
        } catch (error) {
            console.log(`Skipped ${file} (file not found)`);
        }
    }
}

replaceVersionInDeclarations();
