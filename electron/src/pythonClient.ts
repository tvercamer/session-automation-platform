import { net } from 'electron';
import { PYTHON_PORT } from './constants';

export class PythonClient {
    private static baseUrl = '127.0.0.1';

    static async request(method: string, endpoint: string, body: any = null): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = net.request({
                method,
                protocol: 'http:',
                hostname: this.baseUrl,
                port: PYTHON_PORT,
                path: endpoint
            });

            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk.toString());
                response.on('end', () => {
                    if (response.statusCode && response.statusCode >= 400) {
                        reject(new Error(`Backend error: ${response.statusCode} - ${data}`));
                        return;
                    }
                    try {
                        resolve(data ? JSON.parse(data) : null);
                    } catch {
                        resolve(data);
                    }
                });
            });

            request.on('error', (error) => reject(error));

            if (body) {
                request.setHeader('Content-Type', 'application/json');
                request.write(JSON.stringify(body));
            }

            request.end();
        });
    }
}