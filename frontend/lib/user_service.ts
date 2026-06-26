import clientPromise from '@/lib/mongodb';

/**
 * Updates the streak for a given Clerk user ID.
 * - Increments streak by 1 if last active date was yesterday
 * - Resets streak to 1 if last active was more than 1 day ago
 * - Does nothing if already updated today
 */
export async function update_streak(clerkId: string): Promise<void> {
    try {
        const client = await clientPromise;
        if (!client) return;

        const db = client.db();
        const users = db.collection('users');

        const user = await users.findOne({ clerkId });
        if (!user) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const lastActive: Date | undefined = user.lastActiveDate
            ? new Date(user.lastActiveDate)
            : undefined;

        if (lastActive) {
            const lastDay = new Date(
                lastActive.getFullYear(),
                lastActive.getMonth(),
                lastActive.getDate()
            );

            const diffMs = today.getTime() - lastDay.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Already updated today — do nothing
                return;
            } else if (diffDays === 1) {
                // Consecutive day — increment streak
                await users.updateOne(
                    { clerkId },
                    {
                        $inc: { streak: 1 },
                        $set: { lastActiveDate: now },
                    }
                );
            } else {
                // Streak broken — reset to 1
                await users.updateOne(
                    { clerkId },
                    {
                        $set: { streak: 1, lastActiveDate: now },
                    }
                );
            }
        } else {
            // First time — initialize streak
            await users.updateOne(
                { clerkId },
                {
                    $set: { streak: 1, lastActiveDate: now },
                },
                { upsert: true }
            );
        }
    } catch (error) {
        console.error('[user_service] update_streak error:', error);
    }
}
