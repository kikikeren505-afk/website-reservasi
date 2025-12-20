import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  const client = await pool.connect();

  try {
    // 🔹 Contoh update (aktifkan jika kolom sudah ada)
    // await client.query(
    //   "UPDATE notifications SET is_read = true WHERE is_read = false"
    // );

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);

    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  } finally {
    // ✅ PENTING: WAJIB release client PostgreSQL
    client.release();
  }
}
