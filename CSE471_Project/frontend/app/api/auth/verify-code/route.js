import { NextResponse } from 'next/server';
import * as authController from '../../../../../backend/controllers/authController.js';

export async function POST(request) {
    const body = await request.json();
    let responseData = {};
    let responseStatus = 200;

    const mockReq = { body };
    const mockRes = {
        status: (code) => { responseStatus = code; return mockRes; },
        json: (data) => { responseData = data; return mockRes; }
    };

    await authController.verifyCode(mockReq, mockRes);
    return NextResponse.json(responseData, { status: responseStatus });
}