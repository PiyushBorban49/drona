import clientPromise from "@/lib/mongodb";

export async function update_streak(clerkId: string) {
    const client = await clientPromise;
    if (!client) return;
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ clerkId });
    if (!user) return;

    const lastUpdated = user.updatedAt;
    let currentStreak = user.streak || 0;
    const now = new Date();

    if (lastUpdated) {
        const lastDate = new Date(lastUpdated);
        // Reset time to compare dates only
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const last = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

        const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            currentStreak += 1;
        } else if (diffDays > 1) {
            currentStreak = 1;
        }
    } else {
        currentStreak = 1;
    }

    await users.updateOne(
        { clerkId },
        {
            $set: {
                streak: currentStreak,
                updatedAt: now
            }
        }
    );
}

export async function award_xp(clerkId: string, amount: number) {
    const client = await clientPromise;
    if (!client) return;
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ clerkId });
    if (!user) return;

    const currentXp = (user.xp || 0) + amount;
    const newLevel = Math.floor(currentXp / 500) + 1;

    await users.updateOne(
        { clerkId },
        {
            $set: {
                xp: currentXp,
                level: newLevel,
                updatedAt: new Date()
            }
        }
    );
}
