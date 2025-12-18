import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateICPSuggestion } from '@/lib/openai'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { productDescription } = body

        if (!productDescription || typeof productDescription !== 'string') {
            return NextResponse.json(
                { error: 'Product description is required' },
                { status: 400 }
            )
        }

        if (productDescription.length < 10) {
            return NextResponse.json(
                { error: 'Product description is too short' },
                { status: 400 }
            )
        }

        console.log('[ICP Generate] Generating ICP for user:', userId)

        const suggestion = await generateICPSuggestion(productDescription)

        console.log('[ICP Generate] Generated ICP:', suggestion.name)

        return NextResponse.json(suggestion)
    } catch (error) {
        console.error('[ICP Generate] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate ICP' },
            { status: 500 }
        )
    }
}
