import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { creditHistory, searches, users } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function GET(request: Request) {
    try {
        const { orgId, userId } = await auth()
        if (!orgId || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const creditType = searchParams.get('type') // 'enrichment', 'icp', or null for all
        const limit = parseInt(searchParams.get('limit') || '50')

        // Build query conditions
        const conditions = [eq(creditHistory.orgId, orgId)]
        if (creditType) {
            conditions.push(eq(creditHistory.creditType, creditType))
        }

        // Fetch credit history with user info
        const history = await db
            .select({
                id: creditHistory.id,
                creditType: creditHistory.creditType,
                transactionType: creditHistory.transactionType,
                creditsUsed: creditHistory.creditsUsed,
                balanceAfter: creditHistory.balanceAfter,
                description: creditHistory.description,
                searchId: creditHistory.searchId,
                companyId: creditHistory.companyId,
                metadata: creditHistory.metadata,
                createdAt: creditHistory.createdAt,
                userId: creditHistory.userId,
                // User info
                userFirstName: users.firstName,
                userLastName: users.lastName,
                userEmail: users.email,
                userImageUrl: users.imageUrl,
                // Search info (if linked)
                searchName: searches.name,
            })
            .from(creditHistory)
            .leftJoin(users, eq(creditHistory.userId, users.id))
            .leftJoin(searches, eq(creditHistory.searchId, searches.id))
            .where(and(...conditions))
            .orderBy(desc(creditHistory.createdAt))
            .limit(limit)

        // Format the response
        const formattedHistory = history.map(h => ({
            id: h.id,
            creditType: h.creditType,
            transactionType: h.transactionType,
            creditsUsed: h.creditsUsed,
            balanceAfter: h.balanceAfter,
            description: h.description,
            metadata: h.metadata,
            createdAt: h.createdAt,
            user: {
                id: h.userId,
                firstName: h.userFirstName,
                lastName: h.userLastName,
                email: h.userEmail,
                imageUrl: h.userImageUrl,
            },
            search: h.searchId ? {
                id: h.searchId,
                name: h.searchName,
            } : null,
        }))

        return NextResponse.json({ history: formattedHistory })
    } catch (error) {
        console.error('Error fetching credit history:', error)
        return NextResponse.json(
            { error: 'Failed to fetch credit history' },
            { status: 500 }
        )
    }
}
