import { NextResponse } from 'next/server';
import * as authController from '../../../../../backend/controllers/authController.js';

export async function POST(request) {
    const body = await request.json();
    console.log('LOGIN REQUEST BODY:', body);
    
    let responseData = {};
    let responseStatus = 200;

    const mockReq = { body };
    const mockRes = {
        status: (code) => { responseStatus = code; return mockRes; },
        json: (data) => { responseData = data; return mockRes; }
    };

    try {
        await authController.login(mockReq, mockRes);
        console.log('LOGIN RESPONSE:', { status: responseStatus, data: responseData });
    } catch (error) {
        console.error('LOGIN ERROR:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
    
    return NextResponse.json(responseData, { status: responseStatus });
}