import { NextResponse } from 'next/server';
const authController = require('../../../../controllers/authController');

export async function POST(request) {
    const body = await request.json();
    
    let responseData = {};
    let responseStatus = 200;

    const mockRes = {
        status: (code) => { responseStatus = code; return mockRes; },
        json: (data) => { responseData = data; return mockRes; }
    };

    // This calls your Express-style controller logic
    await authController.login({ body }, mockRes);
    
    return NextResponse.json(responseData, { status: responseStatus });
}