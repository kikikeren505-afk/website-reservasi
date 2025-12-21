// Lokasi: app/api/health/route.ts
// ✅ DIPERBAIKI: Pakai query() function yang sudah return rows

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const result = await query('SELECT 1 as test, NOW() as timestamp');

    return NextResponse.json({
      status: 'ok',
      message: 'API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
      dbTest: result[0], // ✅ result sudah array, langsung akses [0]
    });
  } catch (error: any) {
    console.error('❌ Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}