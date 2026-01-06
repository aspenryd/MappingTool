import { generate } from 'openapi-typescript-codegen';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.resolve(__dirname, '../../docs/openapi.json');
const OUTPUT_PATH = path.resolve(__dirname, '../src/client');

const generateClient = async () => {
    try {
        console.log(`Generating client from ${INPUT_PATH}...`);

        await generate({
            input: INPUT_PATH,
            output: OUTPUT_PATH,
            clientName: 'IntegrationMapperClient',
            httpClient: 'fetch',
            useOptions: true,
            indent: '4',
        });

        console.log(`Successfully generated client at ${OUTPUT_PATH}`);
    } catch (error) {
        console.error('Error generating client:', error);
        process.exit(1);
    }
};

generateClient();
