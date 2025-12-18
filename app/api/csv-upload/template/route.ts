import { NextResponse } from 'next/server'
import { generateCSVTemplate } from '@/lib/csv-import'

// GET /api/csv-upload/template - Download CSV template
export async function GET() {
  try {
    const csvContent = generateCSVTemplate()

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="import-template.csv"',
      },
    })
  } catch (error) {
    console.error('Error generating CSV template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}
