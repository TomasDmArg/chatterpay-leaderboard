import { NextRequest, NextResponse } from "next/server";

export function isAdminAuthenticated(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  return token === process.env.ADMIN_PASSWORD;
}

export function withAdminAuth(handler: Function) {
  return async (req: NextRequest) => {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return handler(req);
  };
} 