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

    await authController.verifyCode({ body }, mockRes);
    return NextResponse.json(responseData, { status: responseStatus });
}