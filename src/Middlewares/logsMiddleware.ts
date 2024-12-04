import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Logging requests into a csv file
const logFilePath = path.join(__dirname, '../../route_calls.csv');

if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, 'Route,Method,Count\n');
}


// Logging middleware
const routeCalls: Record<string, number> = {};

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const route = `${req.method} ${req.route ? req.route.path : req.originalUrl}`;

    if (routeCalls[route]) {
        routeCalls[route]++;
    } else {
        routeCalls[route] = 1;
    }

    console.log(`[${formatDate(new Date())}] ${req.method} ${req.originalUrl}`);

    if (req.params && Object.keys(req.params).length > 0) {
        console.log('Params:', req.params);
    }
    if (req.query && Object.keys(req.query).length > 0) {
        console.log('Query:', req.query);
    }
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', req.body);
    }

    next();

    res.on('finish', () => {
        const elapsedTime = Date.now() - startTime;
        console.log(`[${formatDate(new Date())}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Time: ${elapsedTime} ms`);

        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading logs csv file:', err);
                return;
            }

            const lines = data.split('\n');
            let routeFound = false;

            const updatedLines = lines.map((line) => {
                if (line.startsWith(route)) {
                    routeFound = true;
                    const parts = line.split(',');
                    const count = parseInt(parts[2], 10) + 1;
                    return `${parts[0]},${parts[1]},${count}`;
                }
                return line;
            });

            if (!routeFound) {
                updatedLines.push(`${route},${req.method},1`);
            }

            fs.writeFile(logFilePath, updatedLines.join('\n'), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Error while writing logs in csv file:', writeErr);
                }
            });
        });
    });
}
