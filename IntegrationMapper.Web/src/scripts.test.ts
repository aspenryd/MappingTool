import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import path from 'path';

describe('Scripts', () => {
    it('should run api:generate successfully', async () => {
        const scriptPath = path.resolve(__dirname, '../scripts/generate-client.ts');
        const command = `tsx ${scriptPath}`;

        await new Promise<void>((resolve, reject) => {
            exec(command, { cwd: path.resolve(__dirname, '..') }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    console.error(`Stderr: ${stderr}`);
                    reject(error);
                    return;
                }
                expect(stdout).toContain('Successfully generated client');
                resolve();
            });
        });
    }, 30000); // 30s timeout
});
